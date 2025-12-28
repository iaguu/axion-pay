const REDACT_KEYS = new Set([
  "card_number",
  "card_cvv",
  "card_hash",
  "card_holder_name",
  "card_expiration_date",
  "cvv",
  "holder_name",
  "document",
  "documents"
]);

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function redactSensitiveFields(input) {
  if (Array.isArray(input)) {
    return input.map((item) => redactSensitiveFields(item));
  }
  if (!isPlainObject(input)) {
    return input;
  }

  const output = {};
  for (const [key, value] of Object.entries(input)) {
    if (REDACT_KEYS.has(key.toLowerCase())) {
      output[key] = "[redacted]";
    } else {
      output[key] = redactSensitiveFields(value);
    }
  }
  return output;
}
