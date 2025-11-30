# Autonomous GitHub Code System - Enterprise Architecture

**Version:** 1.0.0  
**Organization:** InfinityXOneSystems  
**Status:** Production-Ready Design  
**Last Updated:** November 30, 2025

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Component Specifications](#component-specifications)
4. [Security Model](#security-model)
5. [Data Flow](#data-flow)
6. [Deployment Architecture](#deployment-architecture)
7. [Cost Estimates](#cost-estimates)
8. [Risk Matrix](#risk-matrix)
9. [Operational Procedures](#operational-procedures)

---

## Executive Summary

The Autonomous GitHub Code System is an enterprise-grade infrastructure that enables AI-driven code generation, review, and deployment workflows across the InfinityXOneSystems organization. The system provides:

- **Mobile-first control surface** for on-the-go approvals and command execution
- **Multi-agent AI orchestration** with LLM integration (Quantum Mind System)
- **Automated PR generation** with built-in security scanning and human approval gates
- **Repository synchronization** across development lifecycle stages
- **Zero-trust security model** with secrets management via HashiCorp Vault
- **Comprehensive audit logging** for compliance and forensic analysis
- **Auto-scaling runner infrastructure** for efficient CI/CD execution

### Key Safety Features

- **No automatic billing changes** - All cost-impacting operations require explicit human approval
- **Signed commits only** - All automation uses GPG-signed commits
- **GitHub App authentication** - No personal access tokens in code
- **Branch protection** - Production branches require human review + security checks
- **OPA policy enforcement** - Kubernetes and GitHub operations gated by policy
- **Emergency kill switch** - Instant system pause capability

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MOBILE CONTROL SURFACE                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                     │
│  │ iOS (Swift)  │  │Android(Kt)   │  │  PWA (React) │                     │
│  │ OIDC + PKCE  │  │ OIDC + PKCE  │  │ OIDC + PKCE  │                     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                     │
│         │                 │                  │                              │
│         └─────────────────┴──────────────────┘                              │
│                           │                                                  │
│                           ▼                                                  │
│                  ┌─────────────────┐                                        │
│                  │  API Gateway    │                                        │
│                  │  (Ingress +     │                                        │
│                  │   OIDC Proxy)   │                                        │
│                  └────────┬────────┘                                        │
└──────────────────────────┼─────────────────────────────────────────────────┘
                           │
┌──────────────────────────┼─────────────────────────────────────────────────┐
│                 KUBERNETES CLUSTER (EKS/GKE/AKS)                            │
│                          │                                                   │
│    ┌─────────────────────▼───────────────────────┐                         │
│    │        CONTROL PLANE (FastAPI)              │                         │
│    │  ┌────────────────────────────────────┐    │                         │
│    │  │ /v1/commands  - Mobile Command API │    │                         │
│    │  │ /v1/prs       - PR Management      │    │                         │
│    │  │ /v1/approvals - Approval Workflows │    │                         │
│    │  │ /v1/status    - Job Status         │    │                         │
│    │  │ /v1/killswitch- Emergency Stop     │    │                         │
│    │  └────────────────┬───────────────────┘    │                         │
│    │                   │                         │                         │
│    │    ┌──────────────▼──────────────┐         │                         │
│    │    │   GitHub App Auth Helper    │         │                         │
│    │    │   (JWT + Installation Token)│         │                         │
│    │    └──────────────┬──────────────┘         │                         │
│    │                   │                         │                         │
│    │    ┌──────────────▼──────────────┐         │                         │
│    │    │   LLM Integration Adapter   │         │                         │
│    │    │   (OpenAI/Anthropic/Copilot)│         │                         │
│    │    └──────────────┬──────────────┘         │                         │
│    │                   │                         │                         │
│    │    ┌──────────────▼──────────────┐         │                         │
│    │    │   Encrypted Audit Logger    │         │                         │
│    │    │   (S3 + KMS Encryption)     │         │                         │
│    │    └─────────────────────────────┘         │                         │
│    └─────────────────┬───────────────────────────┘                         │
│                      │                                                      │
│    ┌─────────────────▼───────────────────────┐                            │
│    │         JOB QUEUE (Redis/Celery)        │                            │
│    └─────────────────┬───────────────────────┘                            │
│                      │                                                      │
│    ┌─────────────────▼───────────────────────┐                            │
│    │      ORCHESTRATOR WORKERS (N pods)      │                            │
│    │  ┌────────────────────────────────┐     │                            │
│    │  │ 1. Fetch repository files      │     │                            │
│    │  │ 2. Construct LLM prompts       │     │                            │
│    │  │ 3. Call LLM for code gen       │     │                            │
│    │  │ 4. Run static analysis (local) │     │                            │
│    │  │ 5. Execute unit tests (sandbox)│     │                            │
│    │  │ 6. Create feature branch       │     │                            │
│    │  │ 7. Sign commits (GPG)          │     │                            │
│    │  │ 8. Open PR via GitHub App      │     │                            │
│    │  └────────────────────────────────┘     │                            │
│    └─────────────────┬───────────────────────┘                            │
│                      │                                                      │
│    ┌─────────────────▼───────────────────────┐                            │
│    │       REPO-SYNC SERVICE (N pods)        │                            │
│    │  ┌────────────────────────────────┐     │                            │
│    │  │ Watch foundation repo changes  │     │                            │
│    │  │ Copy selected paths to targets │     │                            │
│    │  │ Create sync PRs (not push)     │     │                            │
│    │  │ Handle conflicts gracefully    │     │                            │
│    │  └────────────────────────────────┘     │                            │
│    └───────────────────────────────────────────                            │
│                                                                             │
│    ┌────────────────────────────────────────┐                             │
│    │   ACTIONS RUNNER CONTROLLER (ARC)     │                             │
│    │  ┌──────────────────────────────┐     │                             │
│    │  │ Ephemeral Runners (K8s pods) │     │                             │
│    │  │ Hardened Runner Images       │     │                             │
│    │  │ Autoscaling (Karpenter/HPA)  │     │                             │
│    │  └──────────────────────────────┘     │                             │
│    └────────────────────────────────────────┘                             │
│                                                                             │
│    ┌────────────────────────────────────────┐                             │
│    │      OBSERVABILITY STACK               │                             │
│    │  ┌──────────────────────────────┐     │                             │
│    │  │ Prometheus (metrics)         │     │                             │
│    │  │ Grafana (dashboards)         │     │                             │
│    │  │ Loki (log aggregation)       │     │                             │
│    │  │ Fluentd/Promtail (collectors)│     │                             │
│    │  │ AlertManager (PagerDuty)     │     │                             │
│    │  └──────────────────────────────┘     │                             │
│    └────────────────────────────────────────┘                             │
│                                                                             │
│    ┌────────────────────────────────────────┐                             │
│    │      SECURITY & POLICY                 │                             │
│    │  ┌──────────────────────────────┐     │                             │
│    │  │ OPA/Gatekeeper (policies)    │     │                             │
│    │  │ cert-manager (TLS)           │     │                             │
│    │  │ Vault (secrets)              │     │                             │
│    │  │ Velero (backup)              │     │                             │
│    │  └──────────────────────────────┘     │                             │
│    └────────────────────────────────────────┘                             │
└─────────────────────────────────────────────────────────────────────────────┘
                           │                    │
                           ▼                    ▼
┌──────────────────────────────────┐   ┌──────────────────────────────────┐
│      MANAGED SERVICES            │   │    GITHUB ORGANIZATION           │
│  ┌────────────────────────┐      │   │  ┌────────────────────────┐     │
│  │ RDS Postgres           │      │   │  │ InfinityXOneSystems/*  │     │
│  │ ElastiCache Redis      │      │   │  │ - foundation (source)  │     │
│  │ S3 (artifacts + logs)  │      │   │  │ - mvp                  │     │
│  │ KMS (encryption keys)  │      │   │  │ - production           │     │
│  │ VPC + Security Groups  │      │   │  │ - enterprise           │     │
│  │ IAM Roles + Policies   │      │   │  │ - taxonomy             │     │
│  └────────────────────────┘      │   │  │ - agents               │     │
└──────────────────────────────────┘   │  │ - doc                  │     │
                                        │  │ - industries           │     │
                                        │  └────────────────────────┘     │
                                        │                                  │
                                        │  ┌────────────────────────┐     │
                                        │  │ GitHub App             │     │
                                        │  │ - Webhook delivery     │     │
                                        │  │ - Installation tokens  │     │
                                        │  │ - Fine-grained perms   │     │
                                        │  └────────────────────────┘     │
                                        └──────────────────────────────────┘
```

---

## Component Specifications

### 1. Control Plane (FastAPI)

**Purpose:** Central API service for receiving mobile commands, managing workflows, and orchestrating LLM-driven code generation.

**Technology Stack:**
- Python 3.11 + FastAPI
- SQLAlchemy ORM (Postgres)
- Redis (job queue + cache)
- Celery (async task processing)
- PyJWT (GitHub App authentication)
- httpx (async HTTP client)

**Endpoints:**

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/v1/commands` | POST | Submit mobile command for execution | OIDC Token |
| `/v1/prs` | GET | List PRs created by automation | OIDC Token |
| `/v1/prs/{pr_id}` | GET | Get PR details and diff preview | OIDC Token |
| `/v1/approvals` | POST | Approve/reject PR | OIDC Token + 2FA |
| `/v1/status/{job_id}` | GET | Get job execution status | OIDC Token |
| `/v1/killswitch` | POST | Emergency system pause | Admin OIDC Token |
| `/v1/billing/proposals` | GET | List pending billing change proposals | Admin OIDC Token |
| `/v1/billing/proposals/{id}/approve` | POST | Approve billing change (multi-party) | Admin OIDC Token |
| `/health` | GET | Health check | Public |
| `/metrics` | GET | Prometheus metrics | Internal only |

**Security Features:**
- OIDC/PKCE authentication
- Rate limiting per user/device
- Encrypted audit logging (AES-256)
- Request signature verification
- IP allowlist for admin endpoints

**Deployment:**
- Kubernetes Deployment (3+ replicas)
- Horizontal Pod Autoscaler (HPA)
- Resource limits: 500Mi memory, 500m CPU
- Liveness/readiness probes
- TLS via cert-manager

---

### 2. Orchestrator Worker

**Purpose:** Execute code generation tasks in isolated sandboxes, run tests, and create PRs.

**Technology Stack:**
- Python 3.11 + Celery
- Docker SDK (for sandbox execution)
- PyGithub (GitHub API client)
- LLM SDKs (OpenAI, Anthropic, Azure)
- Static analysis tools (ruff, mypy, pylint)

**Workflow:**
```
1. Fetch task from Redis queue
2. Clone repository to ephemeral volume
3. Analyze codebase structure
4. Construct LLM prompt from templates (/llm/prompts/*)
5. Call LLM API with structured input
6. Parse LLM response and generate code patches
7. Apply patches to local working copy
8. Run static analysis (ruff, mypy, CodeQL local)
9. Execute unit tests in Docker sandbox
10. If tests pass:
    - Create feature branch (automation/cp-<component>-<timestamp>)
    - Sign commits with bot GPG key
    - Push branch via GitHub App
    - Create PR with detailed description
    - Add labels and request reviewers
11. If tests fail:
    - Log failure with LLM prompt hash
    - Create mobile notification for review
    - Store artifacts in S3
12. Log audit trail (encrypted)
13. Update job status in database
```

**Sandbox Execution:**
- Docker-in-Docker (DinD) or Kubernetes ephemeral pods
- Network egress restricted to allow-listed domains
- No privileged access
- Timeout: 10 minutes per task
- Resource limits: 2Gi memory, 1 CPU

**Deployment:**
- Kubernetes Deployment (5-20 replicas, autoscaling)
- Queue-based scaling (KEDA)
- Pod disruption budget (PDB): min available = 2

---

### 3. GitHub App

**Purpose:** Provide secure, fine-grained access to GitHub repositories without personal access tokens.

**Permissions Required (Least Privilege):**

| Resource | Permission | Reason |
|----------|------------|--------|
| Contents | Read & Write | Create branches, commit code |
| Pull Requests | Read & Write | Create, update, merge PRs |
| Issues | Read & Write | Create issues for failures |
| Metadata | Read | Access repository metadata |
| Workflows | Read & Write | Trigger GitHub Actions |
| Checks | Read & Write | Create status checks |
| Commit Statuses | Read & Write | Update PR status |
| Members | Read | Validate reviewers |

**Webhook Events:**
- `push` (to foundation repo)
- `pull_request` (opened, synchronize, closed)
- `pull_request_review` (submitted, edited)
- `check_run` (completed)
- `workflow_run` (completed)

**Authentication Flow:**
```
1. Generate JWT signed with GitHub App private key
2. Use JWT to request installation access token
3. Use installation token for API calls (expires in 1 hour)
4. Refresh token before expiry
5. Store private key in Vault (never in code)
```

**Installation:**
- Install in InfinityXOneSystems organization
- Select specific repositories (not all)
- Store installation ID in database
- Webhook URL: `https://<control-plane-host>/webhooks/github`

---

### 4. Repository Sync Service

**Purpose:** Safely propagate changes from foundation repo to downstream repos (mvp, production, enterprise).

**Sync Strategy:**
```
foundation (source of truth)
  ├─► mvp (PR creation)
  ├─► production (PR creation + approval required)
  └─► enterprise (PR creation + approval required)
```

**Sync Rules:**
- **Default mode:** Create PRs (never direct push)
- **Paths synced:** Configurable via `.sync-config.yaml`
- **Conflict handling:** Create issue + mobile notification
- **Commit metadata:** Include source commit SHA and author

**Configuration Example (`.sync-config.yaml`):**
```yaml
targets:
  - repo: InfinityXOneSystems/mvp
    paths:
      - src/quantum-mind/**
      - src/taxonomy/**
      - docs/**
    exclude:
      - "**/*.test.ts"
      - "**/secrets/**"
    create_pr: true
    auto_merge: false
    reviewers:
      - team:mvp-team
    labels:
      - sync/foundation
      - auto-generated

  - repo: InfinityXOneSystems/production
    paths:
      - infrastructure/**
      - k8s/**
    create_pr: true
    auto_merge: false
    require_approvals: 2
    reviewers:
      - team:infra
      - team:security
    labels:
      - sync/foundation
      - requires-review
```

**Safety Features:**
- Dry-run mode (preview changes before applying)
- Rollback capability (revert last sync)
- Conflict detection before PR creation
- Human approval for production targets

---

### 5. Actions Runner Controller

**Purpose:** Provide scalable, ephemeral, hardened CI/CD runners for GitHub Actions.

**Architecture:**
- **actions-runner-controller** (Helm chart)
- **Ephemeral runners** (one-time use, destroyed after job)
- **Autoscaling** via Karpenter or cluster-autoscaler
- **Runner groups:** foundation-runners, production-runners

**Hardened Runner Image:**
- Base: Ubuntu 22.04 minimal
- Security: No sudo, read-only root, user namespaces
- Tools: Docker, Node.js, Python, Go, AWS CLI
- Scanning: Trivy scan before deployment
- Updates: Weekly security patches

**Autoscaling Policy:**
```yaml
min_replicas: 2
max_replicas: 20
scale_up_threshold: queue_length > 5
scale_down_delay: 5m
scale_down_threshold: idle > 10m
```

**Cost Optimization:**
- Spot instances for non-production runners
- Hibernate runners during off-hours
- Resource requests aligned with job requirements

---

### 6. OPA/Gatekeeper Policies

**Purpose:** Enforce security and compliance rules on Kubernetes resources and GitHub operations.

**Policies Implemented:**

1. **No Auto-Merge to Production Without Approval**
   ```rego
   package github.pr
   
   deny[msg] {
     input.action == "merge"
     input.base_ref == "main"
     input.repository contains "production"
     count(input.approvals) == 0
     msg := "Production merges require at least one human approval"
   }
   ```

2. **Disallow Secrets in Code**
   ```rego
   package github.commit
   
   deny[msg] {
     secrets := ["password", "api_key", "secret", "token", "private_key"]
     some i
     contains(input.diff, secrets[i])
     msg := sprintf("Commit contains potential secret: %v", [secrets[i]])
   }
   ```

3. **Enforce CodeQL Pass**
   ```rego
   package github.pr
   
   deny[msg] {
     input.action == "merge"
     input.base_ref == "main"
     not codeql_passed(input.check_runs)
     msg := "CodeQL scan must pass before merge"
   }
   
   codeql_passed(checks) {
     some i
     checks[i].name == "CodeQL"
     checks[i].conclusion == "success"
   }
   ```

4. **Block TODOs in Generated Code**
   ```rego
   package github.commit
   
   deny[msg] {
     input.author contains "automation-bot"
     contains(input.diff, "TODO")
     msg := "Generated code cannot contain TODO markers"
   }
   ```

5. **Require Signed Commits**
   ```rego
   package github.commit
   
   deny[msg] {
     not input.commit.verification.verified
     msg := "All commits must be GPG signed"
   }
   ```

**Testing:**
- Unit tests for each policy using conftest
- Integration tests in GitHub Actions
- Monitoring alerts for policy violations

---

### 7. Mobile Control Surface

**Purpose:** Enable on-the-go command submission, PR approval, and system monitoring.

**Platforms:**
- **iOS:** Swift 5.9, SwiftUI, Combine
- **Android:** Kotlin 1.9, Jetpack Compose
- **PWA:** React 18, TypeScript, Workbox

**Features:**

| Feature | iOS | Android | PWA |
|---------|-----|---------|-----|
| OIDC/PKCE Auth | ✅ | ✅ | ✅ |
| Command Submission | ✅ | ✅ | ✅ |
| PR Preview (Diff Viewer) | ✅ | ✅ | ✅ |
| Approve/Reject PR | ✅ | ✅ | ✅ |
| Push Notifications | APNs | FCM | Web Push |
| Biometric Auth | Face ID / Touch ID | Fingerprint / Face | N/A |
| Offline Mode | ✅ (read-only) | ✅ (read-only) | ✅ (read-only) |
| Dark Mode | ✅ | ✅ | ✅ |

**Security:**
- PKCE flow (no client secret stored on device)
- Certificate pinning
- Encrypted local storage (Keychain/Keystore)
- Jailbreak/root detection
- Session timeout: 15 minutes

**Screens:**
1. Login (OIDC)
2. Command Input (free text + templates)
3. Command History
4. PR List (with status badges)
5. PR Detail (diff viewer, files changed)
6. Approval Flow (biometric + confirmation)
7. System Status (metrics dashboard)
8. Settings (logout, notifications, appearance)

---

## Security Model

### Defense in Depth

```
Layer 1: Network
- VPC with private subnets
- Security groups (least privilege)
- WAF rules (rate limiting, geo-blocking)
- DDoS protection (CloudFlare/AWS Shield)

Layer 2: Authentication & Authorization
- OIDC/PKCE for mobile clients
- GitHub App (no PATs)
- Service-to-service: mTLS
- RBAC in Kubernetes
- Vault ACL policies

Layer 3: Application
- Input validation (Pydantic models)
- SQL injection prevention (ORM)
- CSRF protection (SameSite cookies)
- XSS prevention (Content Security Policy)
- Rate limiting per endpoint

Layer 4: Data
- Encryption at rest (KMS)
- Encryption in transit (TLS 1.3)
- Secret rotation (Vault)
- Audit logging (tamper-proof)
- Backup encryption (Velero + KMS)

Layer 5: Monitoring & Response
- Anomaly detection (Prometheus alerts)
- Security scanning (Trivy, CodeQL, Snyk)
- Incident response runbook
- Kill switch capability
```

### Secrets Management

**Storage:**
- **Vault:** Primary secret store (HashiCorp Vault)
- **KMS:** Encryption keys for Vault unseal and S3
- **Never in Git:** .env files excluded via .gitignore

**Secret Types:**

| Secret | Storage Location | Rotation Policy |
|--------|-----------------|-----------------|
| GitHub App Private Key | Vault: `secret/github/app-key` | Manual (1 year) |
| Database Credentials | Vault: `database/creds/app` | Dynamic (24 hours) |
| Redis Password | Vault: `secret/redis/password` | 90 days |
| LLM API Keys | Vault: `secret/llm/api-keys` | 90 days |
| OIDC Client Secret | Vault: `secret/oidc/client` | 90 days |
| S3 Access Keys | Vault: `aws/creds/s3-role` | Dynamic (1 hour) |
| Webhook Secret | Vault: `secret/github/webhook` | 90 days |
| GPG Private Key | Vault: `secret/automation/gpg` | Manual (2 years) |
| APNs Key | Vault: `secret/mobile/apns` | Manual (1 year) |
| FCM Server Key | Vault: `secret/mobile/fcm` | 90 days |

**Access Control:**
- Control plane: Read access to all app secrets
- Workers: Read access to GitHub, LLM, S3
- Sync service: Read access to GitHub only
- Runners: No direct Vault access (secrets injected via annotations)

**Rotation Procedure:**
1. Generate new secret
2. Store in Vault with new version
3. Update application config (no restart)
4. Verify new secret works
5. Revoke old secret after 7-day grace period

---

### Audit Logging

**Log Schema:**
```json
{
  "timestamp": "2025-11-30T12:34:56.789Z",
  "trace_id": "uuid-v4",
  "action_id": "command_execution",
  "user_id": "user@example.com",
  "device_id": "device-fingerprint",
  "ip_address": "10.0.1.42",
  "user_agent": "iOS/18.0 App/1.2.3",
  "action": "submit_command",
  "resource_type": "pr",
  "resource_id": "foundation#1234",
  "llm_provider": "openai",
  "llm_model": "gpt-4",
  "prompt_hash": "sha256:abc123...",
  "tokens_used": 1500,
  "cost_estimate_usd": 0.045,
  "success": true,
  "error_message": null,
  "duration_ms": 3456,
  "commit_sha": "abc123def456",
  "pr_url": "https://github.com/InfinityXOneSystems/foundation/pull/1234"
}
```

**Storage:**
- S3 bucket with versioning enabled
- Server-side encryption (KMS)
- Lifecycle policy: 90 days hot, 1 year glacier, 7 years deep archive
- Immutable (S3 Object Lock)

**Compliance:**
- SOC 2 Type II requirements met
- GDPR: PII can be redacted on request
- HIPAA: PHI excluded from logs

---

## Data Flow

### Command Execution Flow

```
┌─────────┐
│ Mobile  │
│  App    │
└────┬────┘
     │ 1. POST /v1/commands {"command": "Generate API endpoint for user management"}
     │    Authorization: Bearer <OIDC-token>
     ▼
┌─────────────────┐
│ Control Plane   │
│ (FastAPI)       │
└────┬────────────┘
     │ 2. Validate OIDC token
     │ 3. Create job record in DB
     │ 4. Enqueue task in Redis
     │ 5. Return job_id to mobile
     ▼
┌─────────────────┐
│ Redis Queue     │
└────┬────────────┘
     │ 6. Celery worker picks up task
     ▼
┌─────────────────┐
│ Orchestrator    │
│ Worker          │
└────┬────────────┘
     │ 7. Clone foundation repo
     │ 8. Analyze codebase structure
     │ 9. Load prompt template from /llm/prompts/generate_api_endpoint.txt
     │ 10. Construct LLM prompt with context
     ▼
┌─────────────────┐
│ LLM API         │
│ (OpenAI/Claude) │
└────┬────────────┘
     │ 11. Return generated code
     ▼
┌─────────────────┐
│ Orchestrator    │
│ Worker          │
└────┬────────────┘
     │ 12. Apply code patches
     │ 13. Run static analysis (ruff, mypy)
     │ 14. Execute unit tests in Docker sandbox
     │ 15. Tests pass? ─┐
     │                  │ Yes
     │                  ▼
     │            ┌─────────────────┐
     │            │ Create branch   │
     │            │ Sign commits    │
     │            │ Push via GitHub │
     │            │ App             │
     │            └────┬────────────┘
     │                 │ 16. Create PR
     │                 ▼
     │            ┌─────────────────┐
     │            │ GitHub PR       │
     │            │ - Request review│
     │            │ - Add labels    │
     │            │ - Trigger CI    │
     │            └────┬────────────┘
     │                 │ 17. PR created
     │                 ▼
     │            ┌─────────────────┐
     │            │ Control Plane   │
     │            │ Update job      │
     │            │ status          │
     │            └────┬────────────┘
     │                 │ 18. Send mobile notification
     │                 ▼
     │            ┌─────────────────┐
     │            │ Mobile App      │
     │            │ "PR #1234       │
     │            │  created"       │
     │            └─────────────────┘
     │
     │ If tests fail:
     │ ─► Log to S3, Create issue, Notify mobile
```

### Repository Sync Flow

```
┌─────────────────┐
│ foundation repo │
│ Push to main    │
└────┬────────────┘
     │ 1. GitHub webhook: push event
     ▼
┌─────────────────┐
│ Webhook Handler │
│ (Control Plane) │
└────┬────────────┘
     │ 2. Verify webhook signature
     │ 3. Enqueue sync task
     ▼
┌─────────────────┐
│ Repo-Sync       │
│ Service         │
└────┬────────────┘
     │ 4. Fetch .sync-config.yaml
     │ 5. For each target repo:
     │    a. Clone target repo
     │    b. Copy files matching paths
     │    c. Detect conflicts
     │    d. Create feature branch
     │    e. Commit with sync metadata
     │    f. Push branch
     │    g. Create PR
     ▼
┌─────────────────┐
│ mvp repo        │
│ PR created      │
└────┬────────────┘
     │ 6. Trigger GitHub Actions CI
     ▼
┌─────────────────┐
│ GitHub Actions  │
│ - Run tests     │
│ - CodeQL scan   │
│ - Security scan │
└────┬────────────┘
     │ 7. Status checks complete
     ▼
┌─────────────────┐
│ Mobile App      │
│ Notification:   │
│ "Sync PR ready  │
│  for review"    │
└─────────────────┘
```

---

## Deployment Architecture

### AWS Infrastructure

**Region:** us-east-1 (primary), us-west-2 (DR)

**VPC Layout:**
```
VPC: 10.0.0.0/16
├── Public Subnets (10.0.0.0/20)
│   ├── us-east-1a: 10.0.0.0/22
│   ├── us-east-1b: 10.0.4.0/22
│   └── us-east-1c: 10.0.8.0/22
│   └── NAT Gateways, Load Balancers
│
├── Private Subnets (10.0.16.0/20)
│   ├── us-east-1a: 10.0.16.0/22
│   ├── us-east-1b: 10.0.20.0/22
│   └── us-east-1c: 10.0.24.0/22
│   └── EKS Worker Nodes
│
└── Data Subnets (10.0.32.0/20)
    ├── us-east-1a: 10.0.32.0/22
    ├── us-east-1b: 10.0.36.0/22
    └── us-east-1c: 10.0.40.0/22
    └── RDS, ElastiCache (no internet access)
```

**EKS Cluster:**
- Version: 1.28
- Node groups:
  - **system:** t3.medium (2-3 nodes, on-demand)
  - **workers:** t3.large (3-20 nodes, spot + on-demand mix)
  - **runners:** t3.xlarge (2-20 nodes, spot instances)

**RDS Postgres:**
- Instance: db.t3.medium (production: db.r6g.xlarge)
- Multi-AZ deployment
- Automated backups (7 days)
- Encryption at rest (KMS)

**ElastiCache Redis:**
- Instance: cache.t3.medium (production: cache.r6g.large)
- Cluster mode enabled (3 shards)
- Automatic failover
- In-transit encryption (TLS)

**S3 Buckets:**
- **artifacts:** Build outputs, test results
- **audit-logs:** Encrypted audit logs (Object Lock enabled)
- **terraform-state:** Terraform remote state (versioning + encryption)

---

### Kubernetes Deployment Stages

**Stage 1: Bootstrap Infrastructure**
```bash
# 1. Provision AWS resources
cd infrastructure/aws
terraform init
terraform plan
terraform apply

# 2. Configure kubectl
aws eks update-kubeconfig --name infinity-x-one-eks --region us-east-1

# 3. Install core components
cd ../../k8s
./bootstrap.sh
```

**Stage 2: Install Security & Observability**
```bash
# Cert-manager (TLS certificates)
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager --create-namespace \
  --values charts-values/cert-manager-values.yaml

# Vault (secrets management)
helm install vault hashicorp/vault \
  --namespace vault --create-namespace \
  --values charts-values/vault-values.yaml

# OPA Gatekeeper (policy enforcement)
helm install gatekeeper gatekeeper/gatekeeper \
  --namespace gatekeeper-system --create-namespace \
  --values charts-values/gatekeeper-values.yaml

# Prometheus + Grafana (monitoring)
helm install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring --create-namespace \
  --values charts-values/prometheus-values.yaml
```

**Stage 3: Deploy Application Services**
```bash
# Control Plane
helm install control-plane ./control-plane/helm \
  --namespace automation --create-namespace \
  --values control-plane/helm/values.yaml

# Orchestrator Workers
helm install orchestrator-worker ./worker/helm \
  --namespace automation \
  --values worker/helm/values.yaml

# Repo-Sync Service
helm install repo-sync ./sync/helm \
  --namespace automation \
  --values sync/helm/values.yaml

# Actions Runner Controller
helm install actions-runner-controller actions-runner-controller/actions-runner-controller \
  --namespace runners --create-namespace \
  --values runners/arc-values.yaml
```

**Stage 4: Configure GitHub Integration**
```bash
# 1. Create GitHub App (follow /github/README.md)
# 2. Store private key in Vault
vault kv put secret/github/app-key @github-app-private-key.pem

# 3. Configure webhooks
# Webhook URL: https://control-plane.infinity-x-one.dev/webhooks/github
# Events: push, pull_request, pull_request_review, check_run

# 4. Install GitHub App in InfinityXOneSystems org
```

---

## Cost Estimates

### Monthly Cost Breakdown (AWS us-east-1)

| Component | Configuration | Monthly Cost (USD) |
|-----------|--------------|-------------------|
| **Compute** | | |
| EKS Control Plane | 1 cluster | $73 |
| EC2 Worker Nodes (system) | 3x t3.medium (on-demand) | $96 |
| EC2 Worker Nodes (workers) | 10x t3.large (50% spot) | $380 |
| EC2 Runner Nodes | 5x t3.xlarge (80% spot) | $250 |
| **Database** | | |
| RDS Postgres | db.t3.medium, Multi-AZ | $110 |
| ElastiCache Redis | cache.t3.medium, cluster | $85 |
| **Storage** | | |
| S3 (artifacts) | 100GB + requests | $10 |
| S3 (audit logs) | 50GB + lifecycle | $5 |
| EBS Volumes | 500GB gp3 | $45 |
| **Networking** | | |
| NAT Gateway | 3x NAT (HA) | $100 |
| Application Load Balancer | 1x ALB | $25 |
| Data Transfer | 500GB egress | $45 |
| **Security & Monitoring** | | |
| KMS Keys | 3 keys + requests | $5 |
| CloudWatch Logs | 50GB ingestion + retention | $30 |
| **Third-Party SaaS** | | |
| OpenAI API | $100/day budget | $3,000 |
| PagerDuty | Team plan | $29 |
| GitHub Actions (self-hosted) | Included | $0 |
| **Total (without LLM)** | | **$1,288** |
| **Total (with LLM budget)** | | **$4,288** |

### Cost Optimization Strategies

1. **Spot Instances:** 60-80% cost reduction for worker and runner nodes
2. **Reserved Instances:** 30% savings for RDS/ElastiCache (1-year commit)
3. **S3 Lifecycle Policies:** Archive audit logs to Glacier after 90 days
4. **LLM Token Caching:** Cache common prompt responses (50% token reduction)
5. **Autoscaling:** Scale down workers during off-hours (40% compute savings)
6. **Egress Optimization:** Use CloudFront for artifact distribution

### Scaling Projections

| Scale | Monthly Cost | Notes |
|-------|-------------|-------|
| **Development** (10 PRs/day) | $1,500 | Minimal LLM usage, spot instances |
| **Production** (100 PRs/day) | $5,000 | Full LLM budget, HA configuration |
| **Enterprise** (500 PRs/day) | $15,000 | Multi-region, increased LLM budget |

---

## Risk Matrix

| Risk | Likelihood | Impact | Mitigation | Residual Risk |
|------|-----------|--------|------------|---------------|
| **Unauthorized Billing Changes** | Low | Critical | Multi-party approval workflow, kill switch | Low |
| **Secret Leakage in Code** | Medium | High | OPA policies, secret scanning, Vault | Low |
| **LLM Hallucination (Incorrect Code)** | High | Medium | Static analysis, unit tests, human review | Medium |
| **GitHub App Token Compromise** | Low | High | 1-hour token TTL, IP allowlist, audit logging | Low |
| **DDoS Attack on Control Plane** | Medium | Medium | WAF, rate limiting, CloudFlare | Low |
| **Malicious PR Auto-Merge** | Low | Critical | Human approval required, OPA policies | Low |
| **LLM Cost Overrun** | Medium | High | Daily budget cap, cost alerts, kill switch | Low |
| **Database Breach** | Low | Critical | Encryption at rest, network isolation, VPC | Low |
| **Insider Threat (Rogue Admin)** | Low | High | Audit logging, multi-party approval, RBAC | Medium |
| **Supply Chain Attack (Dependency)** | Medium | High | Dependabot, SCA scanning, SBOM generation | Medium |
| **Kubernetes CVE** | Medium | Medium | Auto-patching, version monitoring, PodSecurityPolicy | Low |
| **Mobile App Phishing** | Medium | Medium | Certificate pinning, biometric auth, PKCE | Low |
| **Backup Failure** | Low | High | Velero daily backups, cross-region replication | Low |
| **Sync Conflict Overwrite** | Medium | Medium | PR-only mode, conflict detection, rollback | Low |

---

## Operational Procedures

### Emergency Kill Switch

**Trigger Conditions:**
- LLM cost exceeds daily budget by 200%
- Detected malicious PR activity
- Security incident (breach, unauthorized access)
- Manual invocation by admin

**Kill Switch Actions:**
```bash
# Via Mobile App
POST /v1/killswitch
Authorization: Bearer <admin-oidc-token>
{
  "reason": "security_incident",
  "duration_minutes": 60
}

# Via kubectl (emergency)
kubectl scale deployment control-plane --replicas=0 -n automation
kubectl scale deployment orchestrator-worker --replicas=0 -n automation
kubectl scale deployment repo-sync --replicas=0 -n automation
```

**Effects:**
1. Pause all job processing
2. Revoke GitHub App installation tokens
3. Remove runner labels (prevent new jobs)
4. Send PagerDuty alert to on-call
5. Log kill switch event (audit trail)
6. Display maintenance mode on mobile app

**Recovery:**
```bash
# 1. Verify threat is mitigated
# 2. Scale services back up
kubectl scale deployment control-plane --replicas=3 -n automation
kubectl scale deployment orchestrator-worker --replicas=5 -n automation
kubectl scale deployment repo-sync --replicas=2 -n automation

# 3. Re-generate GitHub App token
# 4. Test with dry-run command
# 5. Resume normal operations
```

---

### Incident Response

**Severity Levels:**

| Level | Response Time | Escalation |
|-------|--------------|------------|
| **P0 - Critical** | 15 minutes | Page on-call + CTO |
| **P1 - High** | 1 hour | Page on-call |
| **P2 - Medium** | 4 hours | Create ticket |
| **P3 - Low** | Next business day | Queue for sprint |

**P0 Scenarios:**
- Production outage (control plane down)
- Security breach (unauthorized access)
- Data loss (database corruption)
- LLM generating malicious code

**Response Procedure:**
```
1. Acknowledge incident in PagerDuty
2. Activate kill switch if needed
3. Assemble incident response team (Slack: #incident-response)
4. Investigate root cause
5. Implement fix
6. Verify resolution
7. Post-mortem within 48 hours
8. Update runbooks
```

---

### Secret Rotation

**Quarterly Rotation (Automated):**
```bash
# Run via GitHub Actions workflow (.github/workflows/rotate-secrets.yml)
# Triggered: Every 90 days

1. Generate new secrets
2. Store in Vault with new version
3. Update K8s secrets via external-secrets-operator
4. Rolling restart of deployments (zero downtime)
5. Verify new secrets work
6. Revoke old secrets after 7 days
7. Notify team in Slack
```

**Manual Rotation (Emergency):**
```bash
# GitHub App Private Key
./scripts/rotate-github-app-key.sh

# Database Credentials
./scripts/rotate-db-credentials.sh

# LLM API Keys
./scripts/rotate-llm-api-keys.sh
```

---

### Backup & Disaster Recovery

**RPO (Recovery Point Objective):** 1 hour  
**RTO (Recovery Time Objective):** 4 hours

**Backup Schedule:**
- **Database:** Automated RDS snapshots (every 6 hours) + daily manual snapshot
- **Kubernetes:** Velero backup (daily at 2 AM UTC) → S3 cross-region replication
- **Vault:** Raft snapshots (every 4 hours) → encrypted S3 storage
- **Audit Logs:** Immutable S3 with versioning (no deletion)

**Disaster Recovery Drill:**
- **Frequency:** Quarterly
- **Scope:** Full cluster rebuild from backups
- **Success Criteria:** Restore within 4 hours, no data loss

**Recovery Procedure:**
```bash
# 1. Provision new infrastructure (DR region)
cd infrastructure/aws
terraform apply -var="region=us-west-2"

# 2. Restore database from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier infinity-x-one-dr \
  --db-snapshot-identifier rds:infinity-x-one-2025-11-30

# 3. Restore Kubernetes resources from Velero
velero restore create --from-backup daily-backup-20251130

# 4. Restore Vault data
vault operator raft snapshot restore vault-snapshot-20251130.snap

# 5. Update DNS to point to DR cluster
# 6. Verify all services operational
# 7. Run smoke tests
```

---

### Monitoring & Alerting

**Key Metrics:**

| Metric | Threshold | Action |
|--------|----------|--------|
| Control Plane Response Time | > 500ms (p95) | Scale up replicas |
| Worker Queue Length | > 50 jobs | Scale up workers |
| LLM API Latency | > 10s | Switch provider |
| Database CPU | > 80% | Scale up instance |
| Redis Memory | > 90% | Scale up instance |
| Runner Queue Time | > 5 minutes | Scale up runners |
| Failed PR Creation Rate | > 10% | Create incident |
| Secret Rotation Overdue | > 100 days | Alert security team |
| Backup Failure | Any failure | Page on-call immediately |

**Grafana Dashboards:**
- **System Overview:** Control plane health, worker status, queue depth
- **GitHub Operations:** PRs created, merge rate, CI pass rate
- **LLM Usage:** Tokens consumed, cost per day, latency by provider
- **Security:** Failed auth attempts, policy violations, secret access
- **Cost Tracking:** Daily spend by service, LLM budget remaining

**PagerDuty Integration:**
- P0 alerts: Page on-call immediately
- P1 alerts: Page on-call (5-minute delay)
- P2 alerts: Create low-urgency incident

---

## Next Steps

1. **Review architecture** with engineering, security, and finance teams
2. **Approve AWS budget** and LLM spend limits
3. **Create GitHub App** and store credentials in temporary secure location
4. **Bootstrap infrastructure** in development AWS account
5. **Deploy services** to Kubernetes cluster
6. **Run acceptance tests** to verify end-to-end flow
7. **Conduct security audit** (penetration testing, policy review)
8. **Train team** on operational procedures and mobile app
9. **Go-live** with limited beta (10 users, monitoring closely)
10. **Iterate** based on feedback and metrics

---

## Appendix

### A. Repository Structure

```
InfinityXOneSystems/foundation/
├── .env.template
├── .gitignore
├── README.md
├── docs/
│   ├── ARCHITECTURE.md (this file)
│   ├── DEPLOYMENT.md
│   └── RUNBOOKS.md
├── infrastructure/
│   └── aws/
│       ├── main.tf
│       ├── variables.tf
│       ├── outputs.tf
│       ├── modules/
│       │   ├── eks/
│       │   ├── rds/
│       │   ├── redis/
│       │   └── vpc/
│       └── terraform.tfvars.example
├── k8s/
│   ├── bootstrap.sh
│   ├── charts-values/
│   │   ├── cert-manager-values.yaml
│   │   ├── vault-values.yaml
│   │   ├── prometheus-values.yaml
│   │   └── gatekeeper-values.yaml
│   └── grafana/
│       └── dashboards/
├── control-plane/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app/
│   ├── tests/
│   └── helm/
├── worker/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── worker/
│   ├── tests/
│   └── helm/
├── sync/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── sync/
│   ├── tests/
│   └── helm/
├── runners/
│   ├── Dockerfile.runner
│   ├── arc-values.yaml
│   └── autoscaler-config.yaml
├── github/
│   ├── app-manifest.yaml
│   └── README.md
├── policies/
│   ├── opa/
│   │   ├── *.rego
│   │   └── tests/
│   └── gatekeeper/
│       └── *.yaml
├── llm/
│   └── prompts/
│       ├── generate_api_endpoint.txt
│       ├── refactor_code.txt
│       └── add_tests.txt
├── mobile/
│   ├── ios/
│   ├── android/
│   └── pwa/
├── automation/
│   └── workflows/
│       ├── test.yml
│       ├── codeql.yml
│       ├── sync.yml
│       └── rotate-secrets.yml
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

---

**END OF ARCHITECTURE DOCUMENT**
