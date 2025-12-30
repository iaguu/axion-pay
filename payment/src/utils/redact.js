export function redactSensitiveFields(obj) {
  if (!obj) return obj;
  const redacted = { ...obj };
  if (redacted.card_hash) redacted.card_hash = '***';
  if (redacted.cvv) redacted.cvv = '***';
  if (redacted.card && redacted.card.cvv) redacted.card.cvv = '***';
  return redacted;
}