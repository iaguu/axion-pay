import fs from "fs";
import path from "path";

let resolvedLogPath = null;

function resolveLogPath() {
  if (resolvedLogPath) return resolvedLogPath;
  const configuredPath = process.env.TEST_LOG_PATH;
  const logPath = configuredPath
    ? path.resolve(process.cwd(), configuredPath)
    : path.resolve(process.cwd(), "logs", "test-log.jsonl");
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  resolvedLogPath = logPath;
  return logPath;
}

export function logTestEvent({ type, message, data }) {
  const logPath = resolveLogPath();
  const payload = {
    timestamp: new Date().toISOString(),
    type: type || "event",
    message: message || "",
    data: data || {}
  };
  fs.appendFileSync(logPath, `${JSON.stringify(payload)}\n`, "utf8");
  return logPath;
}

export function getTestLogPath() {
  return resolveLogPath();
}
