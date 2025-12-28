import fs from "fs";
import path from "path";
import dotenv from "dotenv";

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
  limits: {
    jsonBody: process.env.JSON_BODY_LIMIT || "1mb"
  },
  webhooks: {
    pixSecret: process.env.PIX_WEBHOOK_SECRET || "",
    pagarmeSecret: process.env.PAGARME_WEBHOOK_SECRET || "",
    wooviSecret: process.env.WOOVI_WEBHOOK_SECRET || ""
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
