import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const truthyValues = new Set(["1", "true", "yes", "on"]);
const falsyValues = new Set(["0", "false", "no", "off"]);

function parseBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }
  const normalized = String(value).trim().toLowerCase();
  if (truthyValues.has(normalized)) return true;
  if (falsyValues.has(normalized)) return false;
  return defaultValue;
}

function parseNumber(value, defaultValue) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return defaultValue;
  return parsed;
}

function parseCorsOrigins(value) {
  if (!value) return [];
  const trimmed = String(value).trim();
  if (!trimmed) return [];
  if (trimmed === "*") return "*";
  return trimmed
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const envName = process.env.NODE_ENV || "development";
const basePath = path.resolve(process.cwd(), ".env");
const envPath = path.resolve(process.cwd(), `.env.${envName}`);

const baseConfig = fs.existsSync(basePath)
  ? dotenv.parse(fs.readFileSync(basePath))
  : {};
const envConfig = fs.existsSync(envPath)
  ? dotenv.parse(fs.readFileSync(envPath))
  : {};

for (const [key, value] of Object.entries(baseConfig)) {
  if (process.env[key] === undefined) {
    process.env[key] = value;
  }
}

for (const [key, value] of Object.entries(envConfig)) {
  if (process.env[key] === undefined || process.env[key] === baseConfig[key]) {
    process.env[key] = value;
  }
}

export const config = {
  port: process.env.PORT || 3060,
  env: process.env.NODE_ENV || "development",
  trustProxy: parseNumber(process.env.TRUST_PROXY, 0),
  db: {
    path: process.env.DB_PATH || path.resolve(process.cwd(), "data", "payment.db")
  },
  auth: {
    apiKey: process.env.API_KEY || "",
    required: parseBoolean(process.env.AUTH_REQUIRED, Boolean(process.env.API_KEY))
  },
  sessions: {
    ttlDays: parseNumber(process.env.SESSION_TTL_DAYS, 7),
    adminTtlDays: parseNumber(process.env.ADMIN_SESSION_TTL_DAYS, 1)
  },
  admin: {
    username: process.env.ADMIN_USERNAME || "admin",
    password: process.env.ADMIN_PASSWORD || "123"
  },
  cors: {
    origins: parseCorsOrigins(process.env.CORS_ORIGINS),
    credentials: parseBoolean(process.env.CORS_CREDENTIALS, false)
  },
  rateLimit: {
    windowMs: parseNumber(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    max: parseNumber(process.env.RATE_LIMIT_MAX, 300)
  },
  logging: {
    level: process.env.LOG_LEVEL || "info",
    pretty: parseBoolean(process.env.LOG_PRETTY, envName !== "production"),
    wooviLogPath: process.env.WOOVI_LOG_PATH
      ? path.resolve(process.cwd(), process.env.WOOVI_LOG_PATH)
      : path.resolve(process.cwd(), "logs", "woovi-log.jsonl")
  },
  limits: {
    jsonBody: process.env.JSON_BODY_LIMIT || "1mb"
  },
  webhooks: {
    pixSecret: process.env.PIX_WEBHOOK_SECRET || "",
    pagarmeSecret: process.env.PAGARME_WEBHOOK_SECRET || "",
    wooviSecret: process.env.WOOVI_WEBHOOK_SECRET || "",
    requireTimestamp: parseBoolean(process.env.WEBHOOK_REQUIRE_TIMESTAMP, false),
    toleranceSeconds: parseNumber(process.env.WEBHOOK_TOLERANCE_SECONDS, 300)
  },
  email: {
    from: process.env.EMAIL_FROM || "no-reply@axionpay.local",
    confirmBaseUrl: process.env.EMAIL_CONFIRM_BASE_URL || "http://localhost:3000",
    docsUrl: process.env.DOCS_URL || "http://localhost:3000/api",
    outboxPath: process.env.EMAIL_OUTBOX_PATH || "logs/email-outbox.jsonl",
    smtp: {
      host: process.env.SMTP_HOST || "",
      port: parseNumber(process.env.SMTP_PORT, 0),
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
      secure: parseBoolean(process.env.SMTP_SECURE, false)
    }
  },
  pix: {
    key: process.env.PIX_KEY || "",
    merchantName: process.env.PIX_MERCHANT_NAME || "",
    merchantCity: process.env.PIX_MERCHANT_CITY || "",
    description: process.env.PIX_DESCRIPTION || "",
    txid: process.env.PIX_TXID || "***"
  },
  pagarme: {
    apiKey: process.env.PAGARME_API_KEY || "",
    baseURL: process.env.PAGARME_BASE_URL || "https://api.pagar.me/1"
  },
  woovi: {
    apiKey: process.env.WOOVI_API_KEY || "",
    baseURL: process.env.WOOVI_BASE_URL || "",
    authHeader: process.env.WOOVI_AUTH_HEADER || "",
    pixPath: process.env.WOOVI_PIX_PATH || "",
    pixConfirmPath: process.env.WOOVI_PIX_CONFIRM_PATH || "",
    cardPath: process.env.WOOVI_CARD_PATH || "",
    timeoutMs: Number(process.env.WOOVI_TIMEOUT_MS) || 0
  }
};
