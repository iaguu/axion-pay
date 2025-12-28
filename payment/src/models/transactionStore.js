import { db } from "./db.js";

const insertTransactionStmt = db.prepare(`
  INSERT INTO transactions (
    id,
    amount,
    amount_cents,
    currency,
    method,
    status,
    capture,
    customer,
    customer_id,
    provider,
    provider_reference,
    method_details,
    metadata,
    created_at,
    updated_at
  ) VALUES (
    @id,
    @amount,
    @amount_cents,
    @currency,
    @method,
    @status,
    @capture,
    @customer,
    @customer_id,
    @provider,
    @provider_reference,
    @method_details,
    @metadata,
    @created_at,
    @updated_at
  )
`);

const updateTransactionStmt = db.prepare(`
  UPDATE transactions SET
    amount = @amount,
    amount_cents = @amount_cents,
    currency = @currency,
    method = @method,
    status = @status,
    capture = @capture,
    customer = @customer,
    customer_id = @customer_id,
    provider = @provider,
    provider_reference = @provider_reference,
    method_details = @method_details,
    metadata = @metadata,
    updated_at = @updated_at
  WHERE id = @id
`);

const selectTransactionStmt = db.prepare("SELECT * FROM transactions WHERE id = ?");
const selectEventsStmt = db.prepare(
  "SELECT type, at, details FROM transaction_events WHERE transaction_id = ? ORDER BY id"
);
const insertEventStmt = db.prepare(
  "INSERT INTO transaction_events (transaction_id, type, at, details) VALUES (?, ?, ?, ?)"
);
const updateUpdatedAtStmt = db.prepare("UPDATE transactions SET updated_at = ? WHERE id = ?");
const selectByProviderReferenceStmt = db.prepare(
  "SELECT * FROM transactions WHERE provider_reference = ? LIMIT 1"
);
const selectIdempotencyStmt = db.prepare(
  "SELECT transaction_id FROM idempotency_keys WHERE key = ? LIMIT 1"
);
const upsertIdempotencyStmt = db.prepare(
  "INSERT OR REPLACE INTO idempotency_keys (key, transaction_id, created_at) VALUES (?, ?, ?)"
);

function safeParseJson(value, fallback) {
  if (value === null || value === undefined || value === "") return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function toJson(value) {
  if (value === null || value === undefined) return null;
  return JSON.stringify(value);
}

function buildEvent(type, details = {}) {
  return {
    type,
    at: new Date().toISOString(),
    ...details
  };
}

function mapEventRows(rows) {
  return rows.map((row) => ({
    type: row.type,
    at: row.at,
    ...(safeParseJson(row.details, {}) || {})
  }));
}

function rowToTransaction(row, events = []) {
  if (!row) return null;
  return {
    id: row.id,
    amount: row.amount,
    amount_cents: row.amount_cents,
    currency: row.currency,
    method: row.method,
    status: row.status,
    customer: safeParseJson(row.customer, null),
    provider: row.provider,
    providerReference: row.provider_reference,
    methodDetails: safeParseJson(row.method_details, null),
    capture: Boolean(row.capture),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    metadata: safeParseJson(row.metadata, {}),
    events
  };
}

function loadTransactionWithEvents(row) {
  if (!row) return null;
  const events = mapEventRows(selectEventsStmt.all(row.id));
  return rowToTransaction(row, events);
}

function pickValue(partial, existing, key) {
  return Object.prototype.hasOwnProperty.call(partial, key) ? partial[key] : existing[key];
}

export function createTransaction(data) {
  const now = new Date().toISOString();
  const amountCents = Number.isInteger(data.amount_cents)
    ? data.amount_cents
    : Math.round((data.amount || 0) * 100);
  const tx = {
    id: data.id,
    amount: data.amount ?? amountCents / 100,
    amount_cents: amountCents,
    currency: data.currency || "BRL",
    method: data.method,
    status: "pending",
    customer: data.customer || null,
    provider: data.provider || null,
    providerReference: null,
    methodDetails: data.methodDetails || null,
    capture: data.capture ?? true,
    createdAt: now,
    updatedAt: now,
    metadata: data.metadata || {},
    events: [buildEvent("created", { status: "pending" })]
  };

  const insertTx = db.transaction(() => {
    insertTransactionStmt.run({
      id: tx.id,
      amount: tx.amount,
      amount_cents: tx.amount_cents,
      currency: tx.currency,
      method: tx.method,
      status: tx.status,
      capture: tx.capture ? 1 : 0,
      customer: toJson(tx.customer),
      customer_id: tx.customer?.id ? String(tx.customer.id) : null,
      provider: tx.provider,
      provider_reference: tx.providerReference,
      method_details: toJson(tx.methodDetails),
      metadata: toJson(tx.metadata),
      created_at: tx.createdAt,
      updated_at: tx.updatedAt
    });
    insertEventStmt.run(tx.id, "created", tx.createdAt, toJson({ status: "pending" }));
  });

  insertTx();
  return tx;
}

export function updateTransaction(id, partial) {
  const row = selectTransactionStmt.get(id);
  if (!row) return null;
  const existing = loadTransactionWithEvents(row);
  const nextStatus = pickValue(partial, existing, "status");
  const updatedAt = new Date().toISOString();
  const updated = {
    ...existing,
    amount: pickValue(partial, existing, "amount"),
    amount_cents: pickValue(partial, existing, "amount_cents"),
    currency: pickValue(partial, existing, "currency"),
    method: pickValue(partial, existing, "method"),
    status: nextStatus,
    customer: pickValue(partial, existing, "customer"),
    provider: pickValue(partial, existing, "provider"),
    providerReference: pickValue(partial, existing, "providerReference"),
    methodDetails: pickValue(partial, existing, "methodDetails"),
    capture: pickValue(partial, existing, "capture"),
    metadata: pickValue(partial, existing, "metadata"),
    updatedAt
  };

  const updateTx = db.transaction(() => {
    updateTransactionStmt.run({
      id: updated.id,
      amount: updated.amount,
      amount_cents: updated.amount_cents,
      currency: updated.currency,
      method: updated.method,
      status: updated.status,
      capture: updated.capture ? 1 : 0,
      customer: toJson(updated.customer),
      customer_id: updated.customer?.id ? String(updated.customer.id) : null,
      provider: updated.provider,
      provider_reference: updated.providerReference,
      method_details: toJson(updated.methodDetails),
      metadata: toJson(updated.metadata),
      updated_at: updated.updatedAt
    });

    if (partial.status && partial.status !== existing.status) {
      insertEventStmt.run(
        updated.id,
        "status_changed",
        updated.updatedAt,
        toJson({ from: existing.status, to: partial.status })
      );
    }
  });

  updateTx();
  return loadTransactionWithEvents(selectTransactionStmt.get(id));
}

export function getTransaction(id) {
  const row = selectTransactionStmt.get(id);
  return loadTransactionWithEvents(row);
}

export function listTransactions({ status, method, provider, customerId, from, to } = {}) {
  const where = [];
  const params = [];

  if (status) {
    where.push("status = ?");
    params.push(String(status));
  }
  if (method) {
    where.push("method = ?");
    params.push(String(method));
  }
  if (provider) {
    where.push("provider = ?");
    params.push(provider);
  }
  if (customerId) {
    where.push("customer_id = ?");
    params.push(String(customerId));
  }
  if (from) {
    const fromDate = new Date(from).toISOString();
    if (fromDate !== "Invalid Date") {
      where.push("created_at >= ?");
      params.push(fromDate);
    }
  }
  if (to) {
    const toDate = new Date(to).toISOString();
    if (toDate !== "Invalid Date") {
      where.push("created_at <= ?");
      params.push(toDate);
    }
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const rows = db
    .prepare(`SELECT * FROM transactions ${whereClause} ORDER BY created_at DESC`)
    .all(...params);

  return rows.map((row) => loadTransactionWithEvents(row));
}

export function findTransactionByProviderReference(providerReference) {
  const reference = String(providerReference || "");
  const row = selectByProviderReferenceStmt.get(reference);
  return loadTransactionWithEvents(row);
}

export function getTransactionEvents(id) {
  const row = selectTransactionStmt.get(id);
  if (!row) return null;
  return mapEventRows(selectEventsStmt.all(id));
}

export function appendEvent(id, event) {
  const row = selectTransactionStmt.get(id);
  if (!row) return null;
  const nextEvent = {
    ...event,
    at: new Date().toISOString()
  };
  const { type, at, ...details } = nextEvent;
  insertEventStmt.run(id, type, at, toJson(details));
  updateUpdatedAtStmt.run(nextEvent.at, id);
  return loadTransactionWithEvents(selectTransactionStmt.get(id));
}

export function mergeTransactionMetadata(id, metadata) {
  const existing = getTransaction(id);
  if (!existing) return null;
  const updatedAt = new Date().toISOString();
  const updatedMetadata = {
    ...(existing.metadata || {}),
    ...metadata
  };
  updateTransactionStmt.run({
    id: existing.id,
    amount: existing.amount,
    amount_cents: existing.amount_cents,
    currency: existing.currency,
    method: existing.method,
    status: existing.status,
    capture: existing.capture ? 1 : 0,
    customer: toJson(existing.customer),
    customer_id: existing.customer?.id ? String(existing.customer.id) : null,
    provider: existing.provider,
    provider_reference: existing.providerReference,
    method_details: toJson(existing.methodDetails),
    metadata: toJson(updatedMetadata),
    updated_at: updatedAt
  });
  return loadTransactionWithEvents(selectTransactionStmt.get(id));
}

export function setIdempotencyKey(key, transactionId) {
  if (!key || !transactionId) return;
  upsertIdempotencyStmt.run(String(key), transactionId, new Date().toISOString());
}

export function getTransactionByIdempotencyKey(key) {
  if (!key) return null;
  const row = selectIdempotencyStmt.get(String(key));
  if (!row) return null;
  return getTransaction(row.transaction_id);
}
