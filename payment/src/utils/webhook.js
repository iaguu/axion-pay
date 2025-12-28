import crypto from "crypto";

function parseSignature(signatureHeader) {
  if (!signatureHeader) return { algorithm: "sha256", signature: "" };
  const header = String(signatureHeader).trim();
  const parts = header.split("=");
  if (parts.length === 2 && /^sha(1|256)$/i.test(parts[0])) {
    return { algorithm: parts[0].toLowerCase(), signature: parts[1] };
  }
  return { algorithm: "sha256", signature: header };
}

function safeEqual(a, b) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export function verifyWebhookSignature({ rawBody, signatureHeader, secret }) {
  if (!secret) {
    return { ok: true, skipped: true };
  }
  if (!rawBody) {
    return { ok: false, error: "Missing raw body for signature verification." };
  }
  if (!signatureHeader) {
    return { ok: false, error: "Missing signature header." };
  }

  const { algorithm, signature } = parseSignature(signatureHeader);
  const digest = crypto.createHmac(algorithm, secret).update(rawBody).digest("hex");
  const match = safeEqual(digest, signature);
  if (!match) {
    return { ok: false, error: "Invalid signature." };
  }
  return { ok: true };
}
