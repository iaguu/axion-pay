import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { config } from "../config/env.js";
import { logger } from "../utils/logger.js";

const dbPath = config.dbPath;

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
    id TEXT PRIMARY KEY,
    transaction_id TEXT NOT NULL,
    type TEXT NOT NULL,
    payload TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS idempotency_keys (
    key TEXT PRIMARY KEY,
    transaction_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    cpf TEXT,
    company TEXT,
    cnpj TEXT,
    volume TEXT,
    status TEXT NOT NULL,
    email_verified INTEGER NOT NULL DEFAULT 0,
    docs_sent_at TEXT,
    approved_at TEXT,
    rejected_at TEXT,
    review_notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    key_prefix TEXT NOT NULL,
    last4 TEXT NOT NULL,
    label TEXT,
    created_at TEXT NOT NULL,
    revoked_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS email_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    expires_at TEXT,
    used_at TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    expires_at TEXT,
    revoked_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS admin_sessions (
    id TEXT PRIMARY KEY,
    token_hash TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    expires_at TEXT,
    revoked_at TEXT
  );

  CREATE TABLE IF NOT EXISTS pay_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tag TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS pay_tag_permissions (
    tag_id INTEGER NOT NULL,
    permission_id INTEGER NOT NULL,
    FOREIGN KEY (tag_id) REFERENCES pay_tags(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (tag_id, permission_id)
  );

  CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
  CREATE INDEX IF NOT EXISTS idx_transactions_method ON transactions(method);
  CREATE INDEX IF NOT EXISTS idx_transactions_provider ON transactions(provider);
  CREATE INDEX IF NOT EXISTS idx_transactions_provider_ref ON transactions(provider_reference);
  CREATE INDEX IF NOT EXISTS idx_transactions_customer_id ON transactions(customer_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
  CREATE INDEX IF NOT EXISTS idx_transaction_events_tx ON transaction_events(transaction_id);
  CREATE INDEX IF NOT EXISTS idx_transaction_events_created ON transaction_events(created_at);
  CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
  CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
`);

// Seed data
const permissions = [
  'pix:create',
  'infinitepay:create',
  'admin:view_transactions',
  'admin:view_users',
  'admin:manage_tags'
];

const insertPermission = db.prepare('INSERT OR IGNORE INTO permissions (name) VALUES (?)');
permissions.forEach(p => insertPermission.run(p));

const tags = ['admin', 'user-test'];
const insertTag = db.prepare('INSERT OR IGNORE INTO pay_tags (tag) VALUES (?)');
tags.forEach(t => insertTag.run(t));

const getPermissionId = db.prepare('SELECT id FROM permissions WHERE name = ?');
const getTagId = db.prepare('SELECT id FROM pay_tags WHERE tag = ?');
const insertTagPermission = db.prepare('INSERT OR IGNORE INTO pay_tag_permissions (tag_id, permission_id) VALUES (?, ?)');

const adminId = getTagId.get('admin').id;
permissions.forEach(p => {
  const permId = getPermissionId.get(p).id;
  insertTagPermission.run(adminId, permId);
});

const userTestId = getTagId.get('user-test').id;
const userTestPermissions = ['pix:create', 'infinitepay:create'];
userTestPermissions.forEach(p => {
  const permId = getPermissionId.get(p).id;
  insertTagPermission.run(userTestId, permId);
});


logger.info({ dbPath }, "SQLite inicializado e populado.");

export { db };
