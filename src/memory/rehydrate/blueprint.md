# rehydrate/blueprint.md

## Infinity X One System Blueprint

### Overview
A fully autonomous, production-grade, multi-agent automation pipeline integrating VS Code Copilot, GitHub Copilot, Google Gemini, Hostinger Horizon, and ChatGPT. Features robust validation, memory, taxonomy, evolution, SOP, auto-sync, mobile endpoints, and governance.

---

### 1. Prompts & Plans
- All agent/system prompts, plans, and workflows are versioned and stored in `rehydrate/prompts/` and `rehydrate/plans/`.
- System design and architecture are documented in `rehydrate/blueprint.md`.

### 2. System Design
- Modular Node.js/TypeScript backend (Express orchestrator)
- Agent stubs for all integrations
- Memory system: Google Drive/Sheets/Docs, local persistent storage, semantic/vector DB
- Validation: CI, lint, type-check, tests, secret scan, dependency audit
- Governance: policies/governance-rules.json
- SOP: CRUD/versioned SOPs
- Auto-sync: GitHub, Drive, AI state, webhooks
- Mobile endpoints: /api/mobile

### 3. Guardrails & Governance
- No secrets in code
- All PRs must pass CI
- Dependabot enabled
- SOP versioning enforced
- See policies/governance-rules.json

### 4. Environment Sample
- See .env.example for all required environment variables

### 5. Repo Information
- Owner: InfinityXoneSystems
- Repo: foundation
- Main branch: main

### 6. Automation System
- Orchestrator: src/orchestrator/smart-router.ts
- Agents: src/agents/
- Memory: src/memory/
- Sync: src/sync/
- SOP: src/sop/
- Evolution: src/evolution/
- Governance: policies/

### 7. Integrated AI System
- All agents communicate via orchestrator endpoints
- Memory and taxonomy are shared and versioned
- Evolution and SOP systems log all changes

### 8. Memory System
- Persistent memory: JSON, markdown, and vector DB (see schema below)
- Semantic memory: embeddings, search, and context tagging
- Prune/rotation: LRU, TTL, and semantic relevance

---

## Memory System Schema

### Persistent Memory (rehydrate/memory.json)
```
{
  "id": "string",
  "type": "prompt|plan|event|doc|sop|taxonomy|vector|semantic|snapshot",
  "content": "string|object",
  "embedding": [float],
  "tags": ["string"],
  "created": "ISO8601",
  "updated": "ISO8601",
  "ttl": 86400,
  "lru": 0
}
```

### Vector Store (rehydrate/vectors.json)
```
[
  {
    "id": "string",
    "embedding": [float],
    "contentRef": "id"
  }
]
```

### Semantic Index (rehydrate/semantic.json)
```
{
  "terms": {
    "term": ["id", ...]
  }
}
```

---

## Prune & Rotation System
- **LRU**: Remove least recently used items when memory exceeds threshold
- **TTL**: Remove items past their time-to-live
- **Semantic Prune**: Remove items with lowest semantic relevance to current context
- **Rotation**: Archive pruned items to `rehydrate/archive/` with timestamp

---

## For AI/Agent Bootstrapping
- Read all files in `rehydrate/` for a full system snapshot
- Use `rehydrate/memory.json` for persistent memory
- Use `rehydrate/vectors.json` for vector search
- Use `rehydrate/semantic.json` for semantic search
- Use `rehydrate/prompts/` and `rehydrate/plans/` for system prompts and plans
- Use `rehydrate/blueprint.md` for system design and operational context

---

> This blueprint and memory schema ensure any AI or agent can fully rehydrate, understand, and operate the Infinity X One system autonomously.
