// modules/audit.ts
import * as fs from "fs";
import * as path from "path";
const AUDIT_LOG = path.join(__dirname, "../audit/audit-log.jsonl");

/**
 * Audit logging system
 */
export const audit = {
  log(entry: unknown) {
    const safeEntry = entry instanceof Object ? { ...entry } : entry;
    // Never log secret values
    if (typeof safeEntry === "object" && safeEntry !== null && "secret" in safeEntry) {
      const { secret: _, ...safe } = safeEntry as Record<string, unknown>;
      fs.appendFileSync(AUDIT_LOG, JSON.stringify(safe) + "\n");
    } else {
      fs.appendFileSync(AUDIT_LOG, JSON.stringify(safeEntry) + "\n");
    }
  }
};
