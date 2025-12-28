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
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || "development",
  trustProxy: parseNumber(process.env.TRUST_PROXY, 0),
  db: {
    path: process.env.DB_PATH || path.resolve(process.cwd(), "data", "payment.db")
  },
  auth: {
    apiKey: process.env.API_KEY || "",
    required: parseBoolean(process.env.AUTH_REQUIRED, Boolean(process.env.API_KEY))
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
