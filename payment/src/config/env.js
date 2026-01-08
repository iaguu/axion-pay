import dotenv from "dotenv";

dotenv.config();

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "y", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "n", "off"].includes(normalized)) return false;
  return fallback;
}

function parseNumber(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseCsv(value) {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const env = process.env.NODE_ENV || "development";

export const config = {
  env,
  port: parseNumber(process.env.PORT, 3060),
  trustProxy: parseBoolean(process.env.TRUST_PROXY, false),
  dbPath: process.env.DB_PATH || "data/payment.db",
  jsonBodyLimit: process.env.JSON_BODY_LIMIT || "1mb",
  auth: {
    required: parseBoolean(process.env.AUTH_REQUIRED, false),
    apiKey: process.env.API_KEY || ""
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
    origins:
      process.env.CORS_ORIGINS === "*"
        ? "*"
        : parseCsv(process.env.CORS_ORIGINS || ""),
    credentials: parseBoolean(process.env.CORS_CREDENTIALS, false)
  },
  rateLimit: {
    windowMs: parseNumber(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    max: parseNumber(process.env.RATE_LIMIT_MAX, 300)
  },
  logging: {
    level: process.env.LOG_LEVEL || "info",
    pretty: parseBoolean(process.env.LOG_PRETTY, false),
    wooviLogPath: process.env.WOOVI_LOG_PATH || "logs/woovi-log.jsonl"
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
  woovi: {
    apiKey: process.env.WOOVI_API_KEY || "",
    baseUrl: process.env.WOOVI_BASE_URL || "https://api.woovi-sandbox.com",
    authHeader: process.env.WOOVI_AUTH_HEADER || "",
    pixPath: process.env.WOOVI_PIX_PATH || "/api/v1/charge",
    cardPath: process.env.WOOVI_CARD_PATH || "",
    pixConfirmPath: process.env.WOOVI_PIX_CONFIRM_PATH || "",
    timeoutMs: parseNumber(process.env.WOOVI_TIMEOUT_MS, 10000)
  },
  pagarme: {
    apiKey: process.env.PAGARME_API_KEY || "",
    baseURL: process.env.PAGARME_BASE_URL || "https://api.pagar.me/1"
  },
  webhooks: {
    pixSecret: process.env.PIX_WEBHOOK_SECRET || "",
    wooviSecret: process.env.WOOVI_WEBHOOK_SECRET || "",
    pagarmeSecret: process.env.PAGARME_WEBHOOK_SECRET || "",
    requireTimestamp: parseBoolean(process.env.WEBHOOK_REQUIRE_TIMESTAMP, false),
    toleranceSeconds: parseNumber(process.env.WEBHOOK_TOLERANCE_SECONDS, 300)
  }
};
