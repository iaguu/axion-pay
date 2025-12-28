import { logger } from "../../utils/logger.js";

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

  const reference = "PIX-" + Date.now();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  return {
    success: true,
    status: "pending",
    providerReference: reference,
    raw: {
      amount_cents: amountCents,
      currency: currency || "BRL",
      qrcode: `00020126360014BR.GOV.BCB.PIX01PIXMOCK${reference}`,
      copia_colar: `000201010212PIXMOCK${reference}`,
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
