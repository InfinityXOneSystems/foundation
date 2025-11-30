# Infinity X AUTO ALL Orchestrator

This is the entrypoint for fully automated, auditable, and safe orchestration of the Infinity X system.

- Loads configuration and secrets from environment and secret manager.
- Starts ingestion → indexing → reasoning → execution loops.
- Enforces all governance, audit, and safety rules.
- Logs all actions, approvals, and outcomes to an immutable audit log.
- Requires no manual intervention for normal operation.

---

## Usage

### PowerShell (Windows)
```
powershell -ExecutionPolicy Bypass -File ./start-auto.ps1
```

### Bash (Linux/macOS/WSL)
```
bash ./start-auto.sh
```

---

## Files
- `auto-orchestrator.js` — Main orchestrator entrypoint
- `modules/ingest.js` — Ingestion logic
- `modules/index.js` — Indexing logic
- `modules/reason.js` — Reasoning logic
- `modules/execute.js` — Execution logic
- `modules/sync.js` — System sync logic
- `audit/audit-log.jsonl` — Immutable audit log
- `start-auto.ps1` — Windows startup script
- `start-auto.sh` — Bash startup script

---

## Safety & Audit
- All destructive actions require explicit operator approval (see governance policy).
- All actions are logged with actor, timestamp, intent, and outcome.
- No secret values are ever logged or output.

---

## For more details, see `runbooks/auto-all.md` and `architecture.md`.
