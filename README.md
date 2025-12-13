# Infinity X AUTO ALL Orchestrator

This is the entrypoint for fully automated, auditable, and safe orchestration of the Infinity X system.

- Loads configuration and secrets from environment and secret manager.
- Starts ingestion → indexing → reasoning → execution loops.
- Enforces all governance, audit, and safety rules.
- Logs all actions, approvals, and outcomes to an immutable audit log.
- Requires no manual intervention for normal operation.

---

## Environment Configuration

### Setup

1. Copy the master environment template:
```bash
cp .env.master.template .env
```

2. Fill in your credentials and configuration values in `.env`

3. Validate your environment:
```bash
npm run env:validate
```

### Validation Commands

- `npm run env:validate` - Full environment validation
- `npm run env:check` - Quick validation (skip slow tests)
- `npm run env:validate:json` - JSON output for automation
- `npm run env:validate:ci` - Strict mode for CI/CD
- `npm run env:test-service <service>` - Test specific service
- `npm run env:report` - Generate validation report

See [docs/ENVIRONMENT_VALIDATION_GUIDE.md](docs/ENVIRONMENT_VALIDATION_GUIDE.md) for complete documentation.

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
