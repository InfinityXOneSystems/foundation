// modules/audit.js
const fs = require("fs");
const path = require("path");
const AUDIT_LOG = path.join(__dirname, "../audit/audit-log.jsonl");

module.exports.audit = {
  log(entry) {
    const safeEntry = { ...entry };
    // Never log secret values
    if (safeEntry.secret) delete safeEntry.secret;
    fs.appendFileSync(AUDIT_LOG, JSON.stringify(safeEntry) + "\n");
  }
};
