import { config } from "../../config/env.js";
import { logger } from "../../utils/logger.js";
import { buildPixPayloadData } from "../../utils/pixPayload.js";

function resolvePixConfig() {
  const missing = [];
  if (!config.pix?.key) missing.push("PIX_KEY");
  if (!config.pix?.merchantName) missing.push("PIX_MERCHANT_NAME");
  if (!config.pix?.merchantCity) missing.push("PIX_MERCHANT_CITY");
  if (missing.length > 0) {
    return {
      ok: false,
      error: `Config PIX incompleta: ${missing.join(", ")}`
    };
  }
  return {
    ok: true,
    key: config.pix.key,
    merchantName: config.pix.merchantName,
    merchantCity: config.pix.merchantCity,
    description: config.pix.description,
    txid: config.pix.txid || "***"
  };
}

/**
 * Provedor mock de PIX. Aqui voce pluga futuramente um banco/PSP real.
 */
export async function createPixCharge({ amount, amount_cents, currency, metadata }) {
  const amountCents = Number.isInteger(amount_cents)
    ? amount_cents
    : Math.round((amount || 0) * 100);
  const metadataKeys = metadata && typeof metadata === "object" ? Object.keys(metadata) : [];
  logger.info(
    { amount_cents: amountCents, currency, metadataKeys },
    "Criando cobranca PIX (mock)"
  );

  const pixConfig = resolvePixConfig();
  if (!pixConfig.ok) {
    return {
      success: false,
      status: "failed",
      error: pixConfig.error
    };
  }

  const reference = String(metadata?.transactionId || `PIX-${Date.now()}`);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const txid = metadata?.txid || metadata?.transactionId || pixConfig.txid || "***";
  const description =
    metadata?.description || metadata?.comment || metadata?.order || pixConfig.description || "";
  const hasAmount = amount !== undefined || amount_cents !== undefined;
  const amountValue = hasAmount ? (amountCents / 100).toFixed(2) : undefined;
  const payloadData = buildPixPayloadData({
    pixKey: pixConfig.key,
    merchantName: pixConfig.merchantName,
    merchantCity: pixConfig.merchantCity,
    amount: amountValue,
    txid,
    description: description || undefined
  });

  return {
    success: true,
    status: "pending",
    providerReference: reference,
    provider: "pix-local",
    raw: {
      amount_cents: amountCents,
      currency: currency || "BRL",
      qrcode: payloadData.payload,
      copia_colar: payloadData.payload,
      txid: payloadData.txid,
      expiresAt
    }
  };
}

export async function confirmPixPayment(providerReference) {
  logger.info({ providerReference }, "Confirmando pagamento PIX (mock)");
  return {
    success: true,
    status: "paid",
    providerReference,
    raw: {
      message: "PIX confirmado (mock)"
    }
  };
}
