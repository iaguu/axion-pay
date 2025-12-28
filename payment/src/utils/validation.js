export function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function normalizeCurrency(currency) {
  if (!currency) return "BRL";
  return String(currency).trim().toUpperCase();
}

export function parseAmountInput({ amount, amount_cents }) {
  let parsedAmount = amount;
  let parsedAmountCents = amount_cents;

  if (parsedAmount !== undefined && parsedAmount !== null && parsedAmount !== "") {
    parsedAmount = Number(parsedAmount);
  } else {
    parsedAmount = null;
  }

  if (parsedAmountCents !== undefined && parsedAmountCents !== null && parsedAmountCents !== "") {
    parsedAmountCents = Number(parsedAmountCents);
  } else {
    parsedAmountCents = null;
  }

  if (parsedAmount === null && parsedAmountCents === null) {
    return { error: 'Field "amount" or "amount_cents" is required.' };
  }

  if (parsedAmount !== null && !Number.isFinite(parsedAmount)) {
    return { error: 'Field "amount" must be a valid number.' };
  }

  if (parsedAmountCents !== null && !Number.isFinite(parsedAmountCents)) {
    return { error: 'Field "amount_cents" must be a valid number.' };
  }

  if (parsedAmountCents === null) {
    parsedAmountCents = Math.round(parsedAmount * 100);
  }

  parsedAmountCents = Math.round(parsedAmountCents);

  if (parsedAmountCents <= 0) {
    return { error: 'Field "amount_cents" must be greater than 0.' };
  }

  const normalizedAmount = parsedAmountCents / 100;

  return { amount: normalizedAmount, amount_cents: parsedAmountCents };
}

export function parseOptionalAmountInput({ amount, amount_cents }) {
  if (
    (amount === undefined || amount === null || amount === "") &&
    (amount_cents === undefined || amount_cents === null || amount_cents === "")
  ) {
    return { amount: null, amount_cents: null };
  }
  return parseAmountInput({ amount, amount_cents });
}

export function normalizeMetadata(metadata) {
  return isPlainObject(metadata) ? metadata : {};
}

export function normalizeCustomer(customer) {
  return isPlainObject(customer) ? customer : null;
}

export function normalizeCapture(value) {
  if (value === undefined || value === null) {
    return { value: true };
  }
  if (typeof value === "boolean") {
    return { value };
  }
  if (value === "true") {
    return { value: true };
  }
  if (value === "false") {
    return { value: false };
  }
  return { error: 'Field "capture" must be a boolean.' };
}

export function validateCardInput(card, card_hash) {
  if (card_hash) return null;
  if (!isPlainObject(card)) {
    return 'Field "card" is required when "card_hash" is not provided.';
  }

  const { number, holder_name, exp_month, exp_year, cvv } = card;
  if (!number || !holder_name || !exp_month || !exp_year || !cvv) {
    return 'Fields "number", "holder_name", "exp_month", "exp_year", and "cvv" are required in "card".';
  }

  const digits = String(number).replace(/\D/g, "");
  if (digits.length < 12 || digits.length > 19) {
    return 'Field "card.number" must have between 12 and 19 digits.';
  }

  const month = Number(exp_month);
  const year = Number(exp_year);

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return 'Field "card.exp_month" must be between 1 and 12.';
  }

  if (!Number.isInteger(year) || String(exp_year).length < 2) {
    return 'Field "card.exp_year" must be a valid year.';
  }

  const cvvDigits = String(cvv).replace(/\D/g, "");
  if (cvvDigits.length < 3 || cvvDigits.length > 4) {
    return 'Field "card.cvv" must have 3 or 4 digits.';
  }

  return null;
}

export function buildCardSummary(card) {
  if (!isPlainObject(card) || !card.number) return null;
  const digits = String(card.number).replace(/\D/g, "");
  const last4 = digits.slice(-4);
  return {
    last4: last4 || null,
    exp_month: card.exp_month || null,
    exp_year: card.exp_year || null
  };
}
