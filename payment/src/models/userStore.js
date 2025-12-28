import { v4 as uuid } from "uuid";
import { db } from "./db.js";
import { generateToken, hashToken } from "../utils/tokens.js";

function now() {
  return new Date().toISOString();
}

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    cpf: row.cpf,
    company: row.company,
    cnpj: row.cnpj,
    volume: row.volume,
    status: row.status,
    email_verified: Boolean(row.email_verified),
    docs_sent_at: row.docs_sent_at,
    approved_at: row.approved_at,
    rejected_at: row.rejected_at,
    review_notes: row.review_notes,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

export function createUser({
  name,
  email,
  passwordHash,
  cpf,
  company,
  cnpj,
  volume
}) {
  const id = uuid();
  const timestamp = now();
  db.prepare(
    `INSERT INTO users (
      id, name, email, password_hash, cpf, company, cnpj, volume,
      status, email_verified, created_at, updated_at
    ) VALUES (
      @id, @name, @email, @password_hash, @cpf, @company, @cnpj, @volume,
      @status, @email_verified, @created_at, @updated_at
    )`
  ).run({
    id,
    name,
    email,
    password_hash: passwordHash,
    cpf,
    company,
    cnpj,
    volume,
    status: "pending",
    email_verified: 0,
    created_at: timestamp,
    updated_at: timestamp
  });
  return getUserById(id);
}

export function getUserByEmail(email) {
  const row = db
    .prepare("SELECT * FROM users WHERE lower(email) = lower(?)")
    .get(email);
  return mapUser(row);
}

export function getUserById(id) {
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  return mapUser(row);
}

export function getUserByIdWithPassword(id) {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id);
}

export function getUserByEmailWithPassword(email) {
  return db
    .prepare("SELECT * FROM users WHERE lower(email) = lower(?)")
    .get(email);
}

export function setEmailVerified(userId) {
  db.prepare(
    "UPDATE users SET email_verified = 1, updated_at = ? WHERE id = ?"
  ).run(now(), userId);
  return getUserById(userId);
}

export function updateUserStatus(userId, status, reviewNotes = null) {
  const timestamp = now();
  const fields = {
    status,
    updated_at: timestamp,
    review_notes: reviewNotes
  };
  if (status === "approved") {
    fields.approved_at = timestamp;
    fields.rejected_at = null;
  }
  if (status === "rejected") {
    fields.rejected_at = timestamp;
    fields.approved_at = null;
  }
  db.prepare(
    `UPDATE users
     SET status = @status,
         updated_at = @updated_at,
         review_notes = @review_notes,
         approved_at = @approved_at,
         rejected_at = @rejected_at
     WHERE id = @id`
  ).run({
    id: userId,
    ...fields,
    approved_at: fields.approved_at || null,
    rejected_at: fields.rejected_at || null
  });
  return getUserById(userId);
}

export function markDocsSent(userId) {
  db.prepare("UPDATE users SET docs_sent_at = ?, updated_at = ? WHERE id = ?").run(
    now(),
    now(),
    userId
  );
  return getUserById(userId);
}

export function listUsers({ status, limit = 50, offset = 0 }) {
  const where = status ? "WHERE status = ?" : "";
  const params = status ? [status, limit, offset] : [limit, offset];
  const rows = db
    .prepare(`SELECT * FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(...params);
  const total = status
    ? db.prepare("SELECT COUNT(*) as total FROM users WHERE status = ?").get(status)
        .total
    : db.prepare("SELECT COUNT(*) as total FROM users").get().total;
  return {
    total,
    users: rows.map(mapUser)
  };
}

export function createApiKey({ userId, label }) {
  const key = generateToken("axion_key");
  const keyHash = hashToken(key);
  const prefix = key.slice(0, 8);
  const last4 = key.slice(-4);
  const id = uuid();
  db.prepare(
    `INSERT INTO api_keys (
      id, user_id, key_hash, key_prefix, last4, label, created_at
    ) VALUES (@id, @user_id, @key_hash, @key_prefix, @last4, @label, @created_at)`
  ).run({
    id,
    user_id: userId,
    key_hash: keyHash,
    key_prefix: prefix,
    last4,
    label: label || null,
    created_at: now()
  });
  return { id, key, key_prefix: prefix, last4, label: label || null };
}

export function listApiKeys(userId) {
  return db
    .prepare(
      `SELECT id, key_prefix, last4, label, created_at, revoked_at
       FROM api_keys WHERE user_id = ? ORDER BY created_at DESC`
    )
    .all(userId);
}

export function revokeApiKey({ userId, apiKeyId }) {
  db.prepare(
    "UPDATE api_keys SET revoked_at = ? WHERE id = ? AND user_id = ?"
  ).run(now(), apiKeyId, userId);
}

export function findUserByApiKey(token) {
  const keyHash = hashToken(token);
  const row = db
    .prepare(
      `SELECT u.*, k.revoked_at
       FROM api_keys k
       JOIN users u ON u.id = k.user_id
       WHERE k.key_hash = ?`
    )
    .get(keyHash);
  if (!row || row.revoked_at) return null;
  return mapUser(row);
}

export function createEmailToken({ userId, type, expiresAt }) {
  const token = generateToken("email");
  const tokenHash = hashToken(token);
  const id = uuid();
  db.prepare(
    `INSERT INTO email_tokens (
      id, user_id, token_hash, type, expires_at, created_at
    ) VALUES (@id, @user_id, @token_hash, @type, @expires_at, @created_at)`
  ).run({
    id,
    user_id: userId,
    token_hash: tokenHash,
    type,
    expires_at: expiresAt,
    created_at: now()
  });
  return token;
}

export function consumeEmailToken({ token, type }) {
  const tokenHash = hashToken(token);
  const row = db
    .prepare(
      `SELECT * FROM email_tokens
       WHERE token_hash = ? AND type = ? AND used_at IS NULL`
    )
    .get(tokenHash, type);
  if (!row) return null;
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return null;
  }
  db.prepare("UPDATE email_tokens SET used_at = ? WHERE id = ?").run(
    now(),
    row.id
  );
  return row;
}

export function createSession({ userId, expiresAt }) {
  const token = generateToken("session");
  const tokenHash = hashToken(token);
  const id = uuid();
  db.prepare(
    `INSERT INTO sessions (
      id, user_id, token_hash, created_at, expires_at
    ) VALUES (@id, @user_id, @token_hash, @created_at, @expires_at)`
  ).run({
    id,
    user_id: userId,
    token_hash: tokenHash,
    created_at: now(),
    expires_at: expiresAt
  });
  return token;
}

export function getSessionByToken(token) {
  const tokenHash = hashToken(token);
  const row = db
    .prepare(
      `SELECT u.*, s.expires_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.revoked_at IS NULL`
    )
    .get(tokenHash);
  if (!row) return null;
  if (row.expires_at && new Date(row.expires_at) < new Date()) return null;
  return mapUser(row);
}

export function revokeSession(token) {
  const tokenHash = hashToken(token);
  db.prepare("UPDATE sessions SET revoked_at = ? WHERE token_hash = ?").run(
    now(),
    tokenHash
  );
}

export function createAdminSession({ expiresAt }) {
  const token = generateToken("admin");
  const tokenHash = hashToken(token);
  const id = uuid();
  db.prepare(
    `INSERT INTO admin_sessions (
      id, token_hash, created_at, expires_at
    ) VALUES (@id, @token_hash, @created_at, @expires_at)`
  ).run({
    id,
    token_hash: tokenHash,
    created_at: now(),
    expires_at: expiresAt
  });
  return token;
}

export function getAdminSession(token) {
  const tokenHash = hashToken(token);
  const row = db
    .prepare(
      `SELECT * FROM admin_sessions
       WHERE token_hash = ? AND revoked_at IS NULL`
    )
    .get(tokenHash);
  if (!row) return null;
  if (row.expires_at && new Date(row.expires_at) < new Date()) return null;
  return row;
}

export function revokeAdminSession(token) {
  const tokenHash = hashToken(token);
  db.prepare("UPDATE admin_sessions SET revoked_at = ? WHERE token_hash = ?").run(
    now(),
    tokenHash
  );
}
