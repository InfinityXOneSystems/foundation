// src/utils/logger.ts
import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(__dirname, '../../logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR);

function logFile() {
  const date = new Date().toISOString().slice(0, 10);
  return path.join(LOG_DIR, `system-${date}.log`);
}

export function log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
  const entry = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}\n`;
  fs.appendFileSync(logFile(), entry);
}

export function rotateLogs(maxDays = 7) {
  const files = fs.readdirSync(LOG_DIR);
  const cutoff = Date.now() - maxDays * 86400000;
  for (const file of files) {
    const filePath = path.join(LOG_DIR, file);
    const stat = fs.statSync(filePath);
    if (stat.mtime.getTime() < cutoff) fs.unlinkSync(filePath);
  }
}