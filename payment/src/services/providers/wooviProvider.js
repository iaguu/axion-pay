import axios from "axios";
import { config } from "../../config/env.js";
import { logger } from "../../utils/logger.js";
import { createPixCharge as createPixChargeMock, confirmPixPayment as confirmPixPaymentMock } from "./pixProviderMock.js";
import { redactSensitiveFields } from "../../utils/redact.js";
import { logWooviError, logWooviResponse } from "../../utils/wooviLog.js";

const DEFAULT_TIMEOUT_MS = 10000;

function buildAuthHeader() {
  if (config.woovi.authHeader) {
    return config.woovi.authHeader;
  }
  if (!config.woovi.apiKey) {
    return null;
  }
  return config.woovi.apiKey;
}

function buildClient() {
  const authHeader = buildAuthHeader();
  if (!authHeader) return null;
  return axios.create({
    baseURL: config.woovi.baseURL,
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json"
    },
    timeout: config.woovi.timeoutMs || DEFAULT_TIMEOUT_MS
  });
}

function buildLogUrl(baseURL, endpoint) {
  if (!baseURL) return endpoint || "";
  if (!endpoint) return baseURL;
  if (/^https?:\/\//i.test(endpoint)) {
    return endpoint;
  }
  const trimmedBase = baseURL.endsWith("/") ? baseURL.slice(0, -1) : baseURL;
  const trimmedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${trimmedBase}${trimmedEndpoint}`;
}

function mapStatus(rawStatus) {
  const value = String(rawStatus || "").toLowerCase();
  if (["paid", "completed", "approved", "confirmed", "settled"].includes(value)) {
    return "paid";
  }
  if (["authorized", "auth", "pre_authorized"].includes(value)) {
    return "authorized";
  }
  if (["refunded", "chargeback"].includes(value)) {
    return "refunded";
  }
  if (["canceled", "cancelled"].includes(value)) {
    return "canceled";
  }
  if (["expired", "expired_out"].includes(value)) {
    return "expired";
  }
  if (["failed", "refused", "error"].includes(value)) {
    return "failed";
  }
  return "pending";
}

function extractReference(data) {
  return (
    data?.id ||
    data?.charge?.id ||
    data?.transaction?.id ||
    data?.correlationID ||
    data?.correlationId ||
    data?.charge?.correlationID ||
    data?.charge?.correlationId ||
    data?.pix?.id ||
    null
  );
}

function buildPixPayload({ amount_cents, currency, customer, metadata }) {
  const payload = {
    value: amount_cents,
    correlationID: metadata?.transactionId,
    metadata,
    customer
  };

  if (currency) {
    payload.currency = currency;
  }

  if (metadata?.comment || metadata?.description) {
    payload.comment = metadata.comment || metadata.description;
  }

  return payload;
}

function buildCardPayload({ amount_cents, currency, capture, customer, card, card_hash, metadata }) {
  const payload = {
    amount: amount_cents,
    currency,
    payment_method: "credit_card",
    capture: capture !== false,
    metadata,
    customer
  };

  if (card_hash) {
    payload.card_hash = card_hash;
  } else if (card) {
    payload.card_number = card.number;
    payload.card_holder_name = card.holder_name;
    const month = String(card.exp_month).padStart(2, "0");
    const year = String(card.exp_year).slice(-2);
    payload.card_expiration_date = `${month}${year}`;
    payload.card_cvv = card.cvv;
  }

  return payload;
}

function buildPixMockResult(result) {
  return {
    ...result,
    provider: "woovi-mock"
  };
}

function buildCardMockResult({ amount_cents, capture }) {
  const status = capture === false ? "authorized" : "paid";
  const reference = "WOOVIMOCK-" + Date.now();
  return {
    success: true,
    status,
    provider: "woovi-mock",
    providerReference: reference,
    raw: {
      message: "Transacao aprovada (mock)",
      amount_cents
    }
  };
}

function canUsePixProvider() {
  return Boolean(config.woovi.apiKey && config.woovi.baseURL && config.woovi.pixPath);
}

function canUseCardProvider() {
  return Boolean(config.woovi.apiKey && config.woovi.baseURL && config.woovi.cardPath);
}

export async function createPixCharge({ amount, amount_cents, currency, customer, metadata }) {
  const amountCents = Number.isInteger(amount_cents)
    ? amount_cents
    : Math.round((amount || 0) * 100);

  if (!canUsePixProvider()) {
    const mock = await createPixChargeMock({ amount, amount_cents: amountCents, currency, metadata });
    return buildPixMockResult(mock);
  }

  const client = buildClient();
  if (!client) {
    const mock = await createPixChargeMock({ amount, amount_cents: amountCents, currency, metadata });
    return buildPixMockResult(mock);
  }

  const startedAt = Date.now();
  try {
    const payload = buildPixPayload({ amount_cents: amountCents, currency, customer, metadata });
    logger.info("Enviando cobranca PIX para Woovi", { amount_cents: amountCents });
    const response = await client.post(config.woovi.pixPath, payload);
    const data = response.data || {};
    const status = mapStatus(data.status || data.charge?.status);
    const providerReference = extractReference(data);
    logWooviResponse({
      operation: "pix_create",
      requestId: metadata?.transactionId,
      method: "POST",
      url: buildLogUrl(response?.config?.baseURL, response?.config?.url || config.woovi.pixPath),
      status: response.status,
      durationMs: Date.now() - startedAt,
      data
    });

    return {
      success: status === "paid" || status === "authorized" || status === "pending",
      status,
      provider: "woovi",
      providerReference,
      raw: redactSensitiveFields(data)
    };
  } catch (err) {
    logWooviError({
      operation: "pix_create",
      requestId: metadata?.transactionId,
      method: "POST",
      url: buildLogUrl(config.woovi.baseURL, config.woovi.pixPath),
      status: err?.response?.status,
      durationMs: Date.now() - startedAt,
      error: err?.response?.data || err.message
    });
    logger.error("Erro ao criar cobranca PIX na Woovi", err?.response?.data || err.message);
    return {
      success: false,
      status: "failed",
      error: err?.response?.data || String(err),
      provider: "woovi",
      providerReference: null,
      raw: null
    };
  }
}

export async function confirmPixPayment(providerReference) {
  if (!config.woovi.apiKey || !config.woovi.baseURL) {
    return confirmPixPaymentMock(providerReference);
  }

  if (!config.woovi.pixConfirmPath) {
    return {
      success: false,
      status: "failed",
      error: "Confirmacao PIX nao configurada na Woovi."
    };
  }

  const client = buildClient();
  if (!client) {
    return {
      success: false,
      status: "failed",
      error: "Cliente Woovi nao configurado."
    };
  }

  const startedAt = Date.now();
  try {
    const response = await client.post(config.woovi.pixConfirmPath, {
      providerReference
    });
    const data = response.data || {};
    const status = mapStatus(data.status || data.charge?.status);
    logWooviResponse({
      operation: "pix_confirm",
      requestId: providerReference,
      method: "POST",
      url: buildLogUrl(response?.config?.baseURL, response?.config?.url || config.woovi.pixConfirmPath),
      status: response.status,
      durationMs: Date.now() - startedAt,
      data
    });
    return {
      success: status === "paid" || status === "authorized",
      status,
      providerReference: extractReference(data) || providerReference,
      raw: redactSensitiveFields(data)
    };
  } catch (err) {
    logWooviError({
      operation: "pix_confirm",
      requestId: providerReference,
      method: "POST",
      url: buildLogUrl(config.woovi.baseURL, config.woovi.pixConfirmPath),
      status: err?.response?.status,
      durationMs: Date.now() - startedAt,
      error: err?.response?.data || err.message
    });
    logger.error("Erro ao confirmar PIX na Woovi", err?.response?.data || err.message);
    return {
      success: false,
      status: "failed",
      error: err?.response?.data || String(err),
      providerReference
    };
  }
}

export async function createCardTransactionWithWoovi({
  amount,
  amount_cents,
  currency,
  capture,
  card,
  card_hash,
  customer,
  metadata
}) {
  const amountCents = Number.isInteger(amount_cents)
    ? amount_cents
    : Math.round((amount || 0) * 100);

  if (!canUseCardProvider()) {
    return buildCardMockResult({ amount_cents: amountCents, capture });
  }

  const client = buildClient();
  if (!client) {
    return buildCardMockResult({ amount_cents: amountCents, capture });
  }

  const startedAt = Date.now();
  try {
    const payload = buildCardPayload({
      amount_cents: amountCents,
      currency,
      capture,
      customer,
      card,
      card_hash,
      metadata
    });
    logger.info("Enviando transacao de cartao para Woovi", { amount_cents: amountCents });
    const response = await client.post(config.woovi.cardPath, payload);
    const data = response.data || {};
    const status = mapStatus(data.status || data.transaction?.status);
    const providerReference = extractReference(data);
    logWooviResponse({
      operation: "card_create",
      requestId: metadata?.transactionId,
      method: "POST",
      url: buildLogUrl(response?.config?.baseURL, response?.config?.url || config.woovi.cardPath),
      status: response.status,
      durationMs: Date.now() - startedAt,
      data
    });

    return {
      success: status === "paid" || status === "authorized",
      status,
      provider: "woovi",
      providerReference,
      raw: redactSensitiveFields(data)
    };
  } catch (err) {
    logWooviError({
      operation: "card_create",
      requestId: metadata?.transactionId,
      method: "POST",
      url: buildLogUrl(config.woovi.baseURL, config.woovi.cardPath),
      status: err?.response?.status,
      durationMs: Date.now() - startedAt,
      error: err?.response?.data || err.message
    });
    logger.error("Erro ao criar transacao de cartao na Woovi", err?.response?.data || err.message);
    return {
      success: false,
      status: "failed",
      error: err?.response?.data || String(err),
      provider: "woovi",
      providerReference: null,
      raw: null
    };
  }
}
