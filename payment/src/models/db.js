import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { config } from "../config/env.js";
import { logger } from "../utils/logger.js";

const dbPath = config.db.path;

if (dbPath !== ":memory:") {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    amount REAL NOT NULL,
    amount_cents INTEGER NOT NULL,
    currency TEXT NOT NULL,
    method TEXT NOT NULL,
    status TEXT NOT NULL,
    capture INTEGER NOT NULL,
    customer TEXT,
    customer_id TEXT,
    provider TEXT,
    provider_reference TEXT,
    method_details TEXT,
    metadata TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS transaction_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id TEXT NOT NULL,
    type TEXT NOT NULL,
    at TEXT NOT NULL,
    details TEXT,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS idempotency_keys (
    key TEXT PRIMARY KEY,
    transaction_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
  CREATE INDEX IF NOT EXISTS idx_transactions_method ON transactions(method);
  CREATE INDEX IF NOT EXISTS idx_transactions_provider ON transactions(provider);
  CREATE INDEX IF NOT EXISTS idx_transactions_provider_ref ON transactions(provider_reference);
  CREATE INDEX IF NOT EXISTS idx_transactions_customer_id ON transactions(customer_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
`);

logger.info({ dbPath }, "SQLite inicializado.");

export { db };
