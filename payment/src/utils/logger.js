import pino from "pino";
import { config } from "../config/env.js";

let transport;
if (config.logging.pretty) {
  try {
    transport = pino.transport({
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname,req,res,responseTime",
        levelFirst: true,
        singleLine: true
      }
    });
  } catch (err) {
    console.warn("[WARN] Failed to enable pretty logs. Falling back to JSON.", err?.message || err);
  }
}

export const logger = pino(
  {
    level: config.logging.level,
    base: {
      service: "payment-gateway-api",
      env: config.env
    },
    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers['x-api-key']",
        "req.headers['idempotency-key']",
        "req.body.card",
        "req.body.card_number",
        "req.body.card_cvv",
        "req.body.card_hash",
        "req.body.card_holder_name",
        "req.body.document",
        "req.body.documents"
      ],
      remove: true
    }
  },
  transport
);
