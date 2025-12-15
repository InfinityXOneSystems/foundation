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

---

## Secrets Management & Auto-Discovery

The foundation repository includes an advanced **Secrets Sync System** with auto-discovery and 24/7 daemon mode.

### Quick Start

```bash
# Discover all repositories
npm run secrets:discover

# Setup secrets once (original behavior)
npm run secrets:setup

# Start 24/7 daemon mode
npm run secrets:daemon

# Check sync status
npm run secrets:status
```

### Features
- 🔍 **Auto-Discovery**: Automatically finds all InfinityXOneSystems repositories
- 🔄 **24/7 Daemon**: Continuous operation with configurable sync intervals
- 🔐 **Smart Secrets**: Auto-generates `.gitignore`, `.env.local`, and manifests
- 📊 **Status Tracking**: Real-time sync status and health monitoring

For detailed documentation, see [`docs/SECRETS-SYNC-DAEMON.md`](docs/SECRETS-SYNC-DAEMON.md).

---
