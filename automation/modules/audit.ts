// modules/audit.ts
import * as fs from 'fs';
import * as path from 'path';
const AUDIT_LOG = path.join(__dirname, '../audit/audit-log.jsonl');

export const audit = {
  log(entry: Record<string, any>) {
    const safeEntry = { ...entry };
    // Never log secret values
    if (safeEntry.secret) delete safeEntry.secret;
    fs.appendFileSync(AUDIT_LOG, JSON.stringify(safeEntry) + '\n');
  }
};
