const transactions = new Map();
const idempotencyIndex = new Map();

function buildEvent(type, details = {}) {
  return {
    type,
    at: new Date().toISOString(),
    ...details
  };
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
  transactions.set(tx.id, tx);
  return tx;
}

export function updateTransaction(id, partial) {
  const existing = transactions.get(id);
  if (!existing) return null;
  let events = existing.events || [];
  if (partial.status && partial.status !== existing.status) {
    events = events.concat(
      buildEvent("status_changed", {
        from: existing.status,
        to: partial.status
      })
    );
  }
  const updated = {
    ...existing,
    ...partial,
    updatedAt: new Date().toISOString(),
    events
  };
  transactions.set(id, updated);
  return updated;
}

export function getTransaction(id) {
  return transactions.get(id) || null;
}

export function listTransactions({ status, method, provider, customerId, from, to } = {}) {
  let list = Array.from(transactions.values());

  if (status) {
    const statusValue = String(status);
    list = list.filter((tx) => tx.status === statusValue);
  }
  if (method) {
    const methodValue = String(method);
    list = list.filter((tx) => tx.method === methodValue);
  }
  if (provider) {
    list = list.filter((tx) => tx.provider === provider);
  }
  if (customerId) {
    list = list.filter((tx) => String(tx.customer?.id || "") === String(customerId));
  }
  if (from) {
    const fromDate = new Date(from).getTime();
    if (!Number.isNaN(fromDate)) {
      list = list.filter((tx) => new Date(tx.createdAt).getTime() >= fromDate);
    }
  }
  if (to) {
    const toDate = new Date(to).getTime();
    if (!Number.isNaN(toDate)) {
      list = list.filter((tx) => new Date(tx.createdAt).getTime() <= toDate);
    }
  }

  return list;
}

export function findTransactionByProviderReference(providerReference) {
  const reference = String(providerReference || "");
  return Array.from(transactions.values()).find((tx) => tx.providerReference === reference) || null;
}

export function getTransactionEvents(id) {
  const tx = transactions.get(id);
  return tx ? tx.events || [] : null;
}

export function appendEvent(id, event) {
  const existing = transactions.get(id);
  if (!existing) return null;
  const nextEvent = {
    ...event,
    at: new Date().toISOString()
  };
  const updated = {
    ...existing,
    events: (existing.events || []).concat(nextEvent),
    updatedAt: new Date().toISOString()
  };
  transactions.set(id, updated);
  return updated;
}

export function mergeTransactionMetadata(id, metadata) {
  const existing = transactions.get(id);
  if (!existing) return null;
  const updated = {
    ...existing,
    metadata: {
      ...existing.metadata,
      ...metadata
    },
    updatedAt: new Date().toISOString()
  };
  transactions.set(id, updated);
  return updated;
}

export function setIdempotencyKey(key, transactionId) {
  if (!key || !transactionId) return;
  idempotencyIndex.set(String(key), transactionId);
}

export function getTransactionByIdempotencyKey(key) {
  if (!key) return null;
  const transactionId = idempotencyIndex.get(String(key));
  if (!transactionId) return null;
  return transactions.get(transactionId) || null;
}
