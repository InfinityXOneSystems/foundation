# AUTO ALL Orchestration Runbook

This runbook describes the fully automated, auditable, and safe operation of the Infinity X AUTO ALL system.

- All orchestration is started via `start-auto.ps1` or `start-auto.sh`.
- All actions are logged to `audit/audit-log.jsonl`.
- No manual intervention is required for normal operation.
- Destructive actions require explicit operator approval and are logged with approval metadata.
- For troubleshooting, see `audit/audit-log.jsonl` and system logs.

## Recovery
- If the orchestrator stops, restart with the startup script.
- If audit log is missing or corrupted, halt system and investigate.

## Safety
- Never log or output secret values.
- All actions are auditable and reversible.
