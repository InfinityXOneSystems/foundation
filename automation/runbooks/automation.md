# Automation Orchestrator Runbook (v2)

This runbook describes the operation and recovery of the new Infinity X Automation Orchestrator.

- Start with `scripts/start.ps1` (Windows) or `scripts/start.sh` (Bash).
- All actions are logged to `audit/audit-log.jsonl`.
- No secret values are ever logged or output.
- Destructive actions require explicit operator approval and are logged with approval metadata.

## Recovery
- If the orchestrator stops, restart with the startup script.
- If audit log is missing or corrupted, halt system and investigate.

## Safety
- All actions are auditable and reversible.
- Human-in-the-loop for all sensitive/destructive actions.
