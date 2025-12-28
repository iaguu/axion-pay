import fs from "fs";
import path from "path";
import { redactSensitiveFields } from "./redact.js";

const LOG_PATH = process.env.WOOVI_LOG_PATH
  ? path.resolve(process.cwd(), process.env.WOOVI_LOG_PATH)
  : path.resolve(process.cwd(), "woovi-log.txt");

function appendLine(payload) {
  const line = JSON.stringify(payload, null, 2);
  fs.appendFileSync(LOG_PATH, `${line}\n\n`, "utf8");
}

export function logWooviResponse({
  operation,
  requestId,
  method,
  url,
  status,
  durationMs,
  data
}) {
  appendLine({
    ts: new Date().toISOString(),
    event: "woovi_response",
    operation,
    request_id: requestId || null,
    method,
    url,
    status,
    duration_ms: durationMs,
    response: redactSensitiveFields(data)
  });
}

export function logWooviError({
  operation,
  requestId,
  method,
  url,
  status,
  durationMs,
  error
}) {
  appendLine({
    ts: new Date().toISOString(),
    event: "woovi_error",
    operation,
    request_id: requestId || null,
    method,
    url,
    status: status ?? null,
    duration_ms: durationMs,
    error: redactSensitiveFields(error)
  });
}
