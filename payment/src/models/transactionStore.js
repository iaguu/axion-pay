import { db } from './db.js';

export function createTransaction(data) {
  const stmt = db.prepare(`
    INSERT INTO transactions (id, amount, amount_cents, currency, method, status, capture, customer, customer_id, provider, provider_reference, method_details, metadata, created_at, updated_at)
    VALUES (@id, @amount, @amount_cents, @currency, @method, @status, @capture, @customer, @customer_id, @provider, @provider_reference, @method_details, @metadata, @created_at, @updated_at)
  `);
  
  const now = new Date().toISOString();
  const tx = {
    ...data,
    amount: data.amount || 0,
    amount_cents: data.amount_cents || 0,
    currency: data.currency || 'BRL',
    method: data.method,
    status: data.status || 'pending',
    capture: data.capture !== undefined ? (data.capture ? 1 : 0) : 1,
    customer: JSON.stringify(data.customer || null),
    customer_id: data.customer?.id || null,
    provider: data.provider || null,
    provider_reference: data.providerReference || null,
    method_details: JSON.stringify(data.methodDetails || null),
    metadata: JSON.stringify(data.metadata || null),
    created_at: now,
    updated_at: now,
  };
  
  stmt.run(tx);
  return getTransaction(data.id);
}

export function updateTransaction(id, updates) {
  const fields = [];
  const values = { id };
  
  for (const key in updates) {
    if (key === 'id') continue;
    let value = updates[key];
    if (typeof value === 'object' && value !== null) {
      value = JSON.stringify(value);
    }
    fields.push(`${key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)} = @${key}`);
    values[key] = value;
  }
  fields.push('updated_at = @updated_at');
  values.updated_at = new Date().toISOString();

  if (fields.length === 1) return getTransaction(id);
  
  const stmt = db.prepare(`UPDATE transactions SET ${fields.join(', ')} WHERE id = @id`);
  stmt.run(values);
  return getTransaction(id);
}

export function getTransaction(id) {
  const row = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
  if (!row) return null;
  return mapRow(row);
}

export function findTransactionByProviderReference(ref) {
  const row = db.prepare('SELECT * FROM transactions WHERE provider_reference = ?').get(ref);
  if (!row) return null;
  return mapRow(row);
}

export function listTransactions(criteria = {}) {
  const rows = db.prepare('SELECT * FROM transactions ORDER BY created_at DESC').all();
  return rows.map(mapRow);
}

export function setIdempotencyKey(key, transactionId) {
  try {
    db.prepare('INSERT INTO idempotency_keys (key, transaction_id, created_at) VALUES (?, ?, ?)').run(key, transactionId, new Date().toISOString());
  } catch (e) {
    if (e.code !== 'SQLITE_CONSTRAINT_PRIMARYKEY') {
      throw e;
    }
  }
}

export function getTransactionByIdempotencyKey(key) {
  const row = db.prepare('SELECT transaction_id FROM idempotency_keys WHERE key = ?').get(key);
  if (row) return getTransaction(row.transaction_id);
  return null;
}

export function getTransactionEvents(id) { return []; }
export function appendEvent(id, event) { return getTransaction(id); }
export function mergeTransactionMetadata(id, patch) {
  const tx = getTransaction(id);
  if (!tx) return null;
  const updatedMetadata = { ...tx.metadata, ...patch };
  return updateTransaction(id, { metadata: updatedMetadata });
}

function mapRow(row) {
  const mapped = {};
  for (const key in row) {
    const camelKey = key.replace(/_([a-z])/g, g => g[1].toUpperCase());
    mapped[camelKey] = row[key];
    if (key.endsWith('_json') || key === 'customer' || key === 'metadata' || key === 'method_details') {
      try {
        mapped[camelKey] = JSON.parse(row[key]);
      } catch (e) {
        // keep as string if parsing fails
      }
    }
  }
  return mapped;
}