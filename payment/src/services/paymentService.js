import { generateTransactionId } from "../utils/idGenerator.js";
import {
  createTransaction,
  updateTransaction,
  getTransaction,
  listTransactions,
  findTransactionByProviderReference,
  getTransactionEvents,
  appendEvent,
  mergeTransactionMetadata,
  setIdempotencyKey,
  getTransactionByIdempotencyKey
} from "../models/transactionStore.js";
import {
  createPixCharge,
  confirmPixPayment,
  createCardTransactionWithWoovi
} from "./providers/wooviProvider.js";
import { logger } from "../utils/logger.js";
import { AppError } from "../utils/errors.js";
import { buildCardSummary, normalizeMetadata } from "../utils/validation.js";
import { redactSensitiveFields } from "../utils/redact.js";

/**
 * Cria uma transacao de pagamento (PIX ou Cartao).
 */
export async function createPayment({
  amount,
  amount_cents,
  currency,
  method,
  customer,
  card,
  card_hash,
  capture,
  metadata,
  idempotencyKey
}) {
  if (idempotencyKey) {
    const existing = getTransactionByIdempotencyKey(idempotencyKey);
    if (existing) {
      return existing;
    }
  }

  if (method !== "pix" && method !== "card") {
    throw new AppError("Metodo de pagamento nao suportado.", 400, "invalid_method");
  }

  const id = generateTransactionId();
  const baseMetadata = redactSensitiveFields(normalizeMetadata(metadata));
  const mergedMetadata = {
    ...baseMetadata,
    transactionId: id
  };

  const methodDetails = method === "card" ? buildCardSummary(card) : null;

  const tx = createTransaction({
    id,
    amount,
    amount_cents,
    currency,
    method,
    capture,
    customer,
    methodDetails,
    metadata: mergedMetadata
  });

  if (idempotencyKey) {
    setIdempotencyKey(idempotencyKey, id);
  }

  logger.info("Criando pagamento", { transactionId: id, method });

  if (method === "pix") {
    const result = await createPixCharge({
      amount,
      amount_cents,
      currency,
      customer,
      metadata: mergedMetadata
    });
    if (result.success) {
      return updateTransaction(id, {
        status: result.status,
        provider: result.provider || "woovi",
        providerReference: result.providerReference,
        metadata: {
          ...tx.metadata,
          pix: result.raw
        }
      });
    }
    return updateTransaction(id, {
      status: "failed",
      metadata: {
        ...tx.metadata,
        error: result.error || "Falha ao criar cobranca PIX"
      }
    });
  }

  if (method === "card") {
    const result = await createCardTransactionWithWoovi({
      amount,
      amount_cents,
      currency,
      capture,
      card,
      card_hash,
      customer,
      metadata: mergedMetadata
    });

    if (result.success) {
      return updateTransaction(id, {
        status: result.status,
        provider: result.provider || "woovi",
        providerReference: result.providerReference,
        metadata: {
          ...tx.metadata,
          providerRaw: redactSensitiveFields(result.raw)
        }
      });
    }
    return updateTransaction(id, {
      status: "failed",
      metadata: {
        ...tx.metadata,
        error: redactSensitiveFields(result.error || "Falha ao processar cartao")
      }
    });
  }
}

export function getPayment(transactionId) {
  return getTransaction(transactionId);
}

export function getPaymentByProviderReference(providerReference) {
  return findTransactionByProviderReference(providerReference);
}

export function getPaymentByIdempotencyKey(idempotencyKey) {
  return getTransactionByIdempotencyKey(idempotencyKey);
}

export function listAllPayments(filters) {
  const { limit = 50, offset = 0, ...criteria } = filters || {};
  const list = listTransactions(criteria);
  const total = list.length;
  const sliced = list.slice(offset, offset + limit);
  return {
    total,
    count: sliced.length,
    limit,
    offset,
    transactions: sliced
  };
}

export function getPaymentStats() {
  const list = listTransactions();
  const stats = {
    total: list.length,
    total_amount_cents: 0,
    total_paid_cents: 0,
    by_status: {},
    by_method: {}
  };

  for (const tx of list) {
    stats.total_amount_cents += tx.amount_cents || 0;
    stats.by_status[tx.status] = (stats.by_status[tx.status] || 0) + 1;
    stats.by_method[tx.method] = (stats.by_method[tx.method] || 0) + 1;
    if (tx.status === "paid") {
      stats.total_paid_cents += tx.amount_cents || 0;
    }
  }

  return stats;
}

export function getPaymentEvents(transactionId) {
  return getTransactionEvents(transactionId);
}

export async function confirmPixPaymentManually(transactionId) {
  const tx = getTransaction(transactionId);
  if (!tx) {
    throw new AppError("Transacao nao encontrada.", 404, "not_found");
  }
  if (tx.method !== "pix") {
    throw new AppError("Metodo invalido para confirmacao PIX.", 400, "invalid_method");
  }
  if (!tx.providerReference) {
    throw new AppError("Transacao sem referencia do provedor.", 409, "invalid_state");
  }
  if (tx.status === "paid") {
    return tx;
  }

  const result = await confirmPixPayment(tx.providerReference);
  if (result.success) {
    return updateTransaction(tx.id, {
      status: result.status,
      metadata: {
        ...tx.metadata,
        pixConfirmation: result.raw
      }
    });
  }

  return updateTransaction(tx.id, {
    status: "failed",
    metadata: {
      ...tx.metadata,
      error: result.error || "Falha ao confirmar PIX"
    }
  });
}

export function capturePayment(transactionId) {
  const tx = getTransaction(transactionId);
  if (!tx) {
    throw new AppError("Transacao nao encontrada.", 404, "not_found");
  }
  if (tx.method !== "card") {
    throw new AppError("Metodo invalido para captura.", 400, "invalid_method");
  }
  if (tx.status !== "authorized") {
    throw new AppError("Status invalido para captura.", 409, "invalid_status");
  }

  return updateTransaction(transactionId, {
    status: "paid"
  });
}

export function cancelPayment(transactionId) {
  const tx = getTransaction(transactionId);
  if (!tx) {
    throw new AppError("Transacao nao encontrada.", 404, "not_found");
  }
  if (!["pending", "authorized"].includes(tx.status)) {
    throw new AppError("Status invalido para cancelamento.", 409, "invalid_status");
  }

  return updateTransaction(transactionId, {
    status: "canceled"
  });
}

export function refundPayment(transactionId, amount_cents = null) {
  const tx = getTransaction(transactionId);
  if (!tx) {
    throw new AppError("Transacao nao encontrada.", 404, "not_found");
  }
  if (tx.status !== "paid") {
    throw new AppError("Status invalido para reembolso.", 409, "invalid_status");
  }

  if (amount_cents !== null && amount_cents > tx.amount_cents) {
    throw new AppError("Valor de reembolso maior que o valor da transacao.", 400, "invalid_amount");
  }

  const refundDetails = {
    amount_cents: amount_cents ?? tx.amount_cents
  };

  return updateTransaction(transactionId, {
    status: "refunded",
    metadata: {
      ...tx.metadata,
      refund: refundDetails
    }
  });
}

export function updatePaymentMetadata(transactionId, metadataPatch) {
  const safePatch = redactSensitiveFields(metadataPatch);
  const tx = mergeTransactionMetadata(transactionId, safePatch);
  if (!tx) {
    throw new AppError("Transacao nao encontrada.", 404, "not_found");
  }
  const updated = appendEvent(transactionId, { type: "metadata_updated" });
  return updated || tx;
}

export async function handlePixWebhook({ providerReference, event }) {
  const tx = findTransactionByProviderReference(providerReference);
  if (!tx) {
    logger.warn("Transacao nao encontrada para webhook PIX", { providerReference });
    return null;
  }

  if (event === "PIX_CONFIRMED") {
    const result = await confirmPixPayment(providerReference);
    if (result.success) {
      return updateTransaction(tx.id, {
        status: result.status,
        metadata: {
          ...tx.metadata,
          pixConfirmation: result.raw
        }
      });
    }
    return updateTransaction(tx.id, {
      status: "failed",
      metadata: {
        ...tx.metadata,
        error: result.error || "Falha ao confirmar PIX"
      }
    });
  }

  if (event === "PIX_FAILED") {
    return updateTransaction(tx.id, {
      status: "failed"
    });
  }

  if (event === "PIX_EXPIRED") {
    return updateTransaction(tx.id, {
      status: "expired"
    });
  }

  return tx;
}

export async function handleWooviWebhook(payload) {
  const data = payload?.data || payload || {};
  const metadata =
    data.metadata || data.charge?.metadata || data.transaction?.metadata || data.pix?.metadata || {};
  const rawStatus = data.status || data.charge?.status || data.transaction?.status;
  const providerReference =
    data.id ||
    data.charge?.id ||
    data.transaction?.id ||
    data.correlationID ||
    data.correlationId ||
    data.charge?.correlationID ||
    data.charge?.correlationId ||
    null;

  let tx = null;
  const transactionId = metadata?.transactionId || data.transactionId || data.referenceId;
  if (transactionId) {
    tx = getTransaction(transactionId);
  }
  if (!tx && providerReference) {
    tx = findTransactionByProviderReference(providerReference);
  }
  if (!tx) {
    logger.warn("Transacao nao encontrada para webhook Woovi", {
      transactionId,
      providerReference
    });
    return null;
  }

  let mappedStatus = tx.status;
  const status = String(rawStatus || "").toLowerCase();
  if (["paid", "completed", "approved", "confirmed", "settled"].includes(status)) {
    mappedStatus = "paid";
  } else if (["authorized", "auth", "pre_authorized"].includes(status)) {
    mappedStatus = "authorized";
  } else if (["refused", "failed", "error"].includes(status)) {
    mappedStatus = "failed";
  } else if (["refunded", "chargeback"].includes(status)) {
    mappedStatus = "refunded";
  } else if (["pending", "created", "waiting"].includes(status)) {
    mappedStatus = "pending";
  } else if (["canceled", "cancelled"].includes(status)) {
    mappedStatus = "canceled";
  } else if (["expired"].includes(status)) {
    mappedStatus = "expired";
  }

  return updateTransaction(tx.id, {
    status: mappedStatus,
    providerReference: providerReference ? String(providerReference) : tx.providerReference,
    metadata: {
      ...tx.metadata,
      providerWebhook: redactSensitiveFields(payload)
    }
  });
}
