import { db } from "../models/db.js";
import { config } from "../config/env.js";
import {
  createAdminSession,
  listUsers as listUsersStore,
  updateUserStatus,
  markDocsSent
} from "../models/userStore.js";
import { sendEmail } from "../utils/mailer.js";

function getAllTransactions() {
  return db.prepare('SELECT * FROM transactions ORDER BY created_at DESC').all();
}

function getAllTags() {
  return db.prepare('SELECT * FROM pay_tags').all();
}

function getPermissionsForTag(tagId) {
  return db.prepare('SELECT p.name FROM permissions p JOIN pay_tag_permissions ptp ON p.id = ptp.permission_id WHERE ptp.tag_id = ?').all(tagId);
}

export function listTransactions(req, res) {
  const transactions = getAllTransactions();
  res.json({ ok: true, transactions });
}

export function listUsers(req, res) {
  const { status, limit, offset } = req.query || {};
  const result = listUsersStore({
    status: status ? String(status).toLowerCase() : undefined,
    limit: limit ?? 50,
    offset: offset ?? 0
  });
  res.json({ ok: true, ...result });
}

export function manageTags(req, res) {
  const tags = getAllTags();
  const tagsWithPermissions = tags.map(tag => {
    return {
      ...tag,
      permissions: getPermissionsForTag(tag.id)
    }
  });
  res.json({ ok: true, tags: tagsWithPermissions });
}

export function adminLoginHandler(req, res) {
  const { username, password } = req.body || {};
  if (
    username !== config.admin.username ||
    password !== config.admin.password
  ) {
    return res.status(401).json({
      ok: false,
      error: "Credenciais admin invalidas.",
      code: "invalid_credentials"
    });
  }

  const ttlMs = config.sessions.adminTtlDays * 24 * 60 * 60 * 1000;
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();
  const token = createAdminSession({ expiresAt });
  return res.json({ ok: true, token, expires_at: expiresAt });
}

async function maybeSendDocsEmail(user, notes, sendDocs) {
  if (!sendDocs) return;
  const docsUrl = config.email.docsUrl || "http://localhost:3000/api";
  await sendEmail({
    to: user.email,
    subject: "Documentacao AxionPAY",
    text: `Acesse a documentacao em: ${docsUrl}${notes ? `\n\nObservacoes: ${notes}` : ""}`,
    html: `<p>Acesse a documentacao em:</p><p><a href="${docsUrl}">${docsUrl}</a></p>${
      notes ? `<p>Observacoes: ${notes}</p>` : ""
    }`
  });
  markDocsSent(user.id);
}

export async function approveUserHandler(req, res, next) {
  try {
    const { id } = req.params;
    const { notes, sendDocs } = req.body || {};
    const user = updateUserStatus(id, "approved", notes || null);
    if (!user) {
      return res.status(404).json({ ok: false, error: "Usuario nao encontrado.", code: "not_found" });
    }
    await maybeSendDocsEmail(user, notes, sendDocs);
    return res.json({ ok: true, user });
  } catch (err) {
    return next(err);
  }
}

export async function rejectUserHandler(req, res, next) {
  try {
    const { id } = req.params;
    const { notes } = req.body || {};
    const user = updateUserStatus(id, "rejected", notes || null);
    if (!user) {
      return res.status(404).json({ ok: false, error: "Usuario nao encontrado.", code: "not_found" });
    }
    return res.json({ ok: true, user });
  } catch (err) {
    return next(err);
  }
}
