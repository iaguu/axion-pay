import fs from 'fs';
import path from 'path';

const logDir = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logPath = path.join(logDir, 'test-events.jsonl');

export function getTestLogPath() {
  return logPath;
}

export function logTestEvent(event) {
  const entry = {
    timestamp: new Date().toISOString(),
    ...event
  };
  fs.appendFileSync(logPath, JSON.stringify(entry) + '\n');
}