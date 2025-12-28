import { config } from "../config/env.js";
import { AppError } from "../utils/errors.js";
import { isValidCpf, normalizeCpf } from "../utils/cpf.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import {
  createApiKey,
  createEmailToken,
  createSession,
  consumeEmailToken,
  getUserByEmail,
  getUserByEmailWithPassword,
  getUserById,
  listApiKeys,
  revokeApiKey,
  revokeSession,
  setEmailVerified,
  createUser,
  markDocsSent
} from "../models/userStore.js";
import { sendEmail } from "../utils/mailer.js";

const EMAIL_TOKEN_HOURS = 24;

function buildConfirmUrl(token) {
  const base = config.email.confirmBaseUrl || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/confirmacao?token=${encodeURIComponent(token)}`;
}

function buildDocsUrl() {
  return config.email.docsUrl || "http://localhost:3000/api";
}

function sanitizeCnpj(value) {
  return String(value || "").replace(/\D/g, "");
}

function validateSignupInput({ name, email, password, cpf, company, cnpj }) {
  if (!name || !email || !password || !cpf || !company || !cnpj) {
    throw new AppError("Dados obrigatorios ausentes.", 400, "invalid_request");
  }
  if (!isValidCpf(cpf)) {
    throw new AppError("CPF invalido.", 400, "invalid_cpf");
  }
  const cnpjDigits = sanitizeCnpj(cnpj);
  if (cnpjDigits.length !== 14) {
    throw new AppError("CNPJ invalido.", 400, "invalid_cnpj");
  }
}

export async function signupHandler(req, res, next) {
  try {
    const { name, email, password, cpf, company, cnpj, volume } = req.body;
    validateSignupInput({ name, email, password, cpf, company, cnpj });

    const existing = getUserByEmail(email);
    if (existing) {
      throw new AppError("Email ja cadastrado.", 409, "email_in_use");
    }

    const passwordHash = hashPassword(password);
    const user = createUser({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      passwordHash,
      cpf: normalizeCpf(cpf),
      company: String(company).trim(),
      cnpj: sanitizeCnpj(cnpj),
      volume: volume ? String(volume) : null
    });

    const apiKey = createApiKey({ userId: user.id, label: "sandbox" });
    const expiresAt = new Date(
      Date.now() + EMAIL_TOKEN_HOURS * 60 * 60 * 1000
    ).toISOString();
    const token = createEmailToken({
      userId: user.id,
      type: "verify_email",
      expiresAt
    });
    const confirmUrl = buildConfirmUrl(token);

    await sendEmail({
      to: user.email,
      subject: "Confirme sua conta AxionPAY",
      text: `Confirme sua conta acessando: ${confirmUrl}`,
      html: `<p>Confirme sua conta acessando:</p><p><a href="${confirmUrl}">${confirmUrl}</a></p>`
    });

    const payload = {
      ok: true,
      user,
      api_key: apiKey.key,
      status: user.status
    };
    if (config.env !== "production") {
      payload.confirm_url = confirmUrl;
    }
    return res.status(201).json(payload);
  } catch (err) {
    return next(err);
  }
}

export async function loginHandler(req, res, next) {
  try {
    const { email, password } = req.body;
    const userRow = getUserByEmailWithPassword(email);
    if (!userRow) {
      throw new AppError("Credenciais invalidas.", 401, "invalid_credentials");
    }
    const valid = verifyPassword(password, userRow.password_hash);
    if (!valid) {
      throw new AppError("Credenciais invalidas.", 401, "invalid_credentials");
    }
    const user = getUserById(userRow.id);
    if (!user.email_verified) {
      throw new AppError("Confirme seu email para acessar.", 403, "email_unverified");
    }
    if (["rejected", "suspended"].includes(user.status)) {
      throw new AppError("Conta nao autorizada.", 403, "account_not_allowed");
    }

    const ttlMs = config.sessions.ttlDays * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + ttlMs).toISOString();
    const token = createSession({ userId: user.id, expiresAt });
    return res.json({ ok: true, token, user });
  } catch (err) {
    return next(err);
  }
}

export async function confirmEmailHandler(req, res, next) {
  try {
    const token = req.query.token || req.body?.token;
    if (!token) {
      throw new AppError("Token obrigatorio.", 400, "invalid_request");
    }
    const consumed = consumeEmailToken({ token, type: "verify_email" });
    if (!consumed) {
      throw new AppError("Token invalido ou expirado.", 400, "invalid_token");
    }
    const updated = setEmailVerified(consumed.user_id);
    return res.json({ ok: true, user: updated });
  } catch (err) {
    return next(err);
  }
}

export async function resendConfirmationHandler(req, res, next) {
  try {
    const { email } = req.body;
    const userRow = getUserByEmail(email);
    if (!userRow) {
      return res.json({ ok: true });
    }
    if (userRow.email_verified) {
      return res.json({ ok: true, already_verified: true });
    }

    const expiresAt = new Date(
      Date.now() + EMAIL_TOKEN_HOURS * 60 * 60 * 1000
    ).toISOString();
    const token = createEmailToken({
      userId: userRow.id,
      type: "verify_email",
      expiresAt
    });
    const confirmUrl = buildConfirmUrl(token);

    await sendEmail({
      to: userRow.email,
      subject: "Confirme sua conta AxionPAY",
      text: `Confirme sua conta acessando: ${confirmUrl}`,
      html: `<p>Confirme sua conta acessando:</p><p><a href="${confirmUrl}">${confirmUrl}</a></p>`
    });

    return res.json({
      ok: true,
      ...(config.env !== "production" ? { confirm_url: confirmUrl } : {})
    });
  } catch (err) {
    return next(err);
  }
}

export async function meHandler(req, res, next) {
  try {
    const user = req.user;
    const keys = listApiKeys(user.id);
    return res.json({ ok: true, user, api_keys: keys });
  } catch (err) {
    return next(err);
  }
}

export async function createApiKeyHandler(req, res, next) {
  try {
    const user = req.user;
    const label = req.body?.label;
    const apiKey = createApiKey({ userId: user.id, label });
    return res.status(201).json({ ok: true, api_key: apiKey.key, api_key_meta: apiKey });
  } catch (err) {
    return next(err);
  }
}

export async function listApiKeysHandler(req, res, next) {
  try {
    const user = req.user;
    const keys = listApiKeys(user.id);
    return res.json({ ok: true, api_keys: keys });
  } catch (err) {
    return next(err);
  }
}

export async function revokeApiKeyHandler(req, res, next) {
  try {
    const user = req.user;
    const { id } = req.params;
    revokeApiKey({ userId: user.id, apiKeyId: id });
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
}

export async function logoutHandler(req, res, next) {
  try {
    if (req.sessionToken) {
      revokeSession(req.sessionToken);
    }
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
}

export async function sendDocsHandler(req, res, next) {
  try {
    const user = req.user;
    const docsUrl = buildDocsUrl();
    await sendEmail({
      to: user.email,
      subject: "Documentacao AxionPAY",
      text: `Acesse a documentacao em: ${docsUrl}`,
      html: `<p>Acesse a documentacao em:</p><p><a href="${docsUrl}">${docsUrl}</a></p>`
    });
    const updated = markDocsSent(user.id);
    return res.json({ ok: true, user: updated });
  } catch (err) {
    return next(err);
  }
}
