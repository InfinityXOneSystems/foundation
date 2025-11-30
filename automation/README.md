# Infinity X Automation Orchestrator (v2)

This directory contains the new, robust, and auditable automation/orchestration system for Infinity X.

## Key Features
- Modular, testable, and maintainable codebase
- Strict audit logging (no secret values, only metadata)
- Human-in-the-loop for all sensitive/destructive actions
- Pluggable adapters for providers (OpenAI, Gemini, Anthropic, Hostinger, GitHub, etc.)
- Secure secret management (never log or expose secrets)
- Observability: metrics, traces, and structured logs
- Developer-friendly: clear structure, docs, and test harness

## Structure
- `orchestrator.ts` — Main orchestrator entrypoint
- `modules/` — Ingestion, indexing, reasoning, execution, sync, audit
- `adapters/` — Provider adapters (standard interface)
- `audit/` — Immutable audit logs
- `scripts/` — Startup scripts (PowerShell, Bash)
- `README.md` — This file
- `runbooks/` — Operational docs and runbooks

## Usage
See `scripts/start.ps1` or `scripts/start.sh` for one-command startup.

---

For architecture, see `../architecture.md`.
For runbook, see `runbooks/automation.md`.
