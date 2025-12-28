import { config } from "../config/env.js";
import { AppError } from "../utils/errors.js";
import {
  createAdminSession,
  createApiKey,
  getUserById,
  listApiKeys,
  listUsers,
  markDocsSent,
  updateUserStatus,
  revokeAdminSession
} from "../models/userStore.js";
import { sendEmail } from "../utils/mailer.js";

function buildDocsUrl() {
  return config.email.docsUrl || "http://localhost:3000/api";
}

function buildAdminSession() {
  const ttlMs = config.sessions.adminTtlDays * 24 * 60 * 60 * 1000;
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();
  return createAdminSession({ expiresAt });
}

export async function adminLoginHandler(req, res, next) {
  try {
    const { username, password } = req.body;
    if (username !== config.admin.username || password !== config.admin.password) {
      throw new AppError("Credenciais invalidas.", 401, "invalid_credentials");
    }
    const token = buildAdminSession();
    return res.json({ ok: true, token });
  } catch (err) {
    return next(err);
  }
}

export async function adminLogoutHandler(req, res, next) {
  try {
    if (req.adminToken) {
      revokeAdminSession(req.adminToken);
    }
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
}

export async function listUsersHandler(req, res, next) {
  try {
    const { status, limit, offset } = req.query;
    const result = listUsers({ status, limit, offset });
    return res.json({ ok: true, ...result });
  } catch (err) {
    return next(err);
  }
}

export async function approveUserHandler(req, res, next) {
  try {
    const { id } = req.params;
    const { notes, sendDocs } = req.body || {};
    const user = updateUserStatus(id, "approved", notes || null);
    if (!user) {
      throw new AppError("Usuario nao encontrado.", 404, "not_found");
    }
    let docsSent = false;
    if (sendDocs) {
      await sendEmail({
        to: user.email,
        subject: "Documentacao AxionPAY",
        text: `Acesse a documentacao em: ${buildDocsUrl()}`,
        html: `<p>Acesse a documentacao em:</p><p><a href="${buildDocsUrl()}">${buildDocsUrl()}</a></p>`
      });
      markDocsSent(user.id);
      docsSent = true;
    }
    return res.json({ ok: true, user, docs_sent: docsSent });
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
      throw new AppError("Usuario nao encontrado.", 404, "not_found");
    }
    return res.json({ ok: true, user });
  } catch (err) {
    return next(err);
  }
}

export async function generateApiKeyHandler(req, res, next) {
  try {
    const { id } = req.params;
    const user = getUserById(id);
    if (!user) {
      throw new AppError("Usuario nao encontrado.", 404, "not_found");
    }
    const apiKey = createApiKey({ userId: id, label: req.body?.label || "admin" });
    return res.status(201).json({ ok: true, api_key: apiKey.key, api_key_meta: apiKey });
  } catch (err) {
    return next(err);
  }
}

export async function listUserApiKeysHandler(req, res, next) {
  try {
    const { id } = req.params;
    const user = getUserById(id);
    if (!user) {
      throw new AppError("Usuario nao encontrado.", 404, "not_found");
    }
    const keys = listApiKeys(id);
    return res.json({ ok: true, api_keys: keys });
  } catch (err) {
    return next(err);
  }
}

export async function sendDocsToUserHandler(req, res, next) {
  try {
    const { id } = req.params;
    const user = getUserById(id);
    if (!user) {
      throw new AppError("Usuario nao encontrado.", 404, "not_found");
    }
    await sendEmail({
      to: user.email,
      subject: "Documentacao AxionPAY",
      text: `Acesse a documentacao em: ${buildDocsUrl()}`,
      html: `<p>Acesse a documentacao em:</p><p><a href="${buildDocsUrl()}">${buildDocsUrl()}</a></p>`
    });
    const updated = markDocsSent(user.id);
    return res.json({ ok: true, user: updated });
  } catch (err) {
    return next(err);
  }
}
