#!/usr/bin/env bash
set -euo pipefail
# bootstrap_mcp_tool.sh
# - Installs a portable mcp_sync tool at ~/bin/mcp_sync.sh
# - Installs a helper auto-sync watcher at .mcp_auto_sync.sh for each cloned repo
# - Drops an example systemd user service template at ~/.config/systemd/user/mcp_auto_sync@.service
#
# Usage: paste & run. After running:
#   ORG=InfinityXOneSystems REPO=foundation LOCAL_DIR=~/projects/foundation ~/bin/mcp_sync.sh
#
# Notes:
# - Requires: git, gh (GitHub CLI), code (VS Code CLI) recommended. Install them first.
# - This script will NOT print or store secret values. It will not call GitHub APIs unless you run mcp_sync.sh with gh commands.
# - Mobile phone: not required. Install GitHub mobile app if you want PR notifications on your phone.

INSTALL_DIR="${HOME}/bin"
mkdir -p "$INSTALL_DIR"

cat > "$INSTALL_DIR/mcp_sync.sh" <<'MCP'
#!/usr/bin/env bash
set -euo pipefail
# mcp_sync.sh - simple MCP local <> GitHub sync helper
# Example:
#   ORG=InfinityXOneSystems REPO=foundation LOCAL_DIR=~/projects/foundation ./mcp_sync.sh
#
ORG="${ORG:-InfinityXOneSystems}"
REPO="${REPO:-}"
BRANCH="${BRANCH:-main}"
LOCAL_DIR="${LOCAL_DIR:-$(pwd)/${REPO}}"
WORKSPACE="${WORKSPACE:-true}"
GIT_NAME="${GIT_NAME:-}"
GIT_EMAIL="${GIT_EMAIL:-}"
AUTO_PUSH="${AUTO_PUSH:-false}"
AUTO_MESSAGE="${AUTO_MESSAGE:-mcp: auto-sync changes}"
DRY_RUN="${DRY_RUN:-false}"

# Enterprise communication settings
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"
DISCORD_WEBHOOK="${DISCORD_WEBHOOK:-}"
TEAMS_WEBHOOK="${TEAMS_WEBHOOK:-}"
PAGERDUTY_KEY="${PAGERDUTY_KEY:-}"
ENABLE_METRICS="${ENABLE_METRICS:-false}"
ENABLE_LOGGING="${ENABLE_LOGGING:-false}"
LOG_FILE="${LOG_FILE:-${HOME}/.mcp/logs/mcp_sync.log}"

if [ -z "$REPO" ]; then
  echo "Usage: ORG=<org> REPO=<repo> LOCAL_DIR=~/proj/<repo> $0"
  exit 2
fi

run() {
  if [ "$DRY_RUN" = "true" ]; then
    echo "[DRY_RUN] $*"
  else
    eval "$@"
  fi
}

# Structured logging function
log() {
  local level="$1"
  shift
  local message="$*"
  local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
  
  if [ "$ENABLE_LOGGING" = "true" ]; then
    mkdir -p "$(dirname "$LOG_FILE")"
    echo "{\"timestamp\":\"$timestamp\",\"level\":\"$level\",\"repo\":\"$REPO\",\"message\":\"$message\",\"correlationId\":\"$(uuidgen 2>/dev/null || echo $RANDOM)\"}" >> "$LOG_FILE"
  fi
  
  # Console output
  echo "[$level] $message"
}

# Send webhook notification
send_notification() {
  local status="$1"
  local message="$2"
  local color="${3:-#808080}"
  
  local payload="{\"text\":\"MCP Sync [$status]: $REPO - $message\",\"status\":\"$status\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}"
  
  # Slack webhook
  if [ -n "$SLACK_WEBHOOK" ]; then
    curl -X POST -H 'Content-type: application/json' \
      --data "{\"text\":\"MCP Sync [$status]: \`$REPO\` - $message\",\"attachments\":[{\"color\":\"$color\",\"fields\":[{\"title\":\"Repository\",\"value\":\"$ORG/$REPO\",\"short\":true},{\"title\":\"Branch\",\"value\":\"$BRANCH\",\"short\":true}]}]}" \
      "$SLACK_WEBHOOK" 2>/dev/null || true
  fi
  
  # Discord webhook
  if [ -n "$DISCORD_WEBHOOK" ]; then
    curl -X POST -H 'Content-type: application/json' \
      --data "{\"content\":\"**MCP Sync [$status]**: \`$REPO\` - $message\",\"embeds\":[{\"color\":$(echo $color | sed 's/#//;s/\(.\{2\}\)\(.\{2\}\)\(.\{2\}\)/0x\1\2\3/'),\"fields\":[{\"name\":\"Repository\",\"value\":\"$ORG/$REPO\",\"inline\":true},{\"name\":\"Branch\",\"value\":\"$BRANCH\",\"inline\":true}]}]}" \
      "$DISCORD_WEBHOOK" 2>/dev/null || true
  fi
  
  # Teams webhook
  if [ -n "$TEAMS_WEBHOOK" ]; then
    curl -X POST -H 'Content-type: application/json' \
      --data "{\"@type\":\"MessageCard\",\"@context\":\"http://schema.org/extensions\",\"themeColor\":\"$color\",\"summary\":\"MCP Sync $status\",\"sections\":[{\"activityTitle\":\"MCP Sync [$status]\",\"activitySubtitle\":\"$ORG/$REPO\",\"facts\":[{\"name\":\"Repository:\",\"value\":\"$ORG/$REPO\"},{\"name\":\"Branch:\",\"value\":\"$BRANCH\"},{\"name\":\"Message:\",\"value\":\"$message\"}]}]}" \
      "$TEAMS_WEBHOOK" 2>/dev/null || true
  fi
}

# Record metrics
record_metric() {
  local metric_name="$1"
  local value="$2"
  local tags="${3:-}"
  
  if [ "$ENABLE_METRICS" = "true" ]; then
    local metrics_file="${HOME}/.mcp/metrics/mcp_sync_metrics.log"
    mkdir -p "$(dirname "$metrics_file")"
    echo "$(date +%s),${metric_name},${value},repo=${REPO},branch=${BRANCH}${tags:+,$tags}" >> "$metrics_file"
  fi
}

# Prechecks
if ! command -v gh >/dev/null 2>&1; then
  echo "WARNING: gh (GitHub CLI) not found. Install: https://cli.github.com/ and run 'gh auth login' before using full features."
fi
if ! command -v git >/dev/null 2>&1; then
  echo "BLOCKER: git is required. Install git and re-run."
  exit 2
fi

log "INFO" "Starting MCP sync for org=$ORG repo=$REPO branch=$BRANCH local=$LOCAL_DIR"
SYNC_START=$(date +%s)

# Clone or update
if [ -d "$LOCAL_DIR/.git" ]; then
  log "INFO" "Local repo exists, fetching updates..."
  run "git -C \"$LOCAL_DIR\" fetch --all --prune"
  run "git -C \"$LOCAL_DIR\" checkout \"$BRANCH\" || git -C \"$LOCAL_DIR\" checkout -b \"$BRANCH\" origin/$BRANCH || true"
  run "git -C \"$LOCAL_DIR\" pull --rebase"
  send_notification "SUCCESS" "Repository updated successfully" "#36a64f"
else
  log "INFO" "Cloning https://github.com/${ORG}/${REPO}.git to $LOCAL_DIR"
  run "mkdir -p \"$(dirname \"$LOCAL_DIR\")\""
  if run "git clone https://github.com/${ORG}/${REPO}.git \"$LOCAL_DIR\""; then
    run "git -C \"$LOCAL_DIR\" checkout -B \"$BRANCH\" || true"
    send_notification "SUCCESS" "Repository cloned successfully" "#36a64f"
  else
    log "ERROR" "Failed to clone repository"
    send_notification "FAILURE" "Failed to clone repository" "#ff0000"
    exit 1
  fi
fi

# Optionally set local git config for this repo
if [ -n "$GIT_NAME" ]; then
  run "git -C \"$LOCAL_DIR\" config user.name \"$GIT_NAME\""
fi
if [ -n "$GIT_EMAIL" ]; then
  run "git -C \"$LOCAL_DIR\" config user.email \"$GIT_EMAIL\""
fi

# Create VS Code workspace file
if [ "$WORKSPACE" = "true" ]; then
  WSFILE="${LOCAL_DIR}/${REPO}.code-workspace"
  cat > "$WSFILE" <<EOF
{
  "folders": [
    { "path": "." }
  ],
  "settings": {}
}
EOF
  echo "Workspace created: $WSFILE"
fi

# Create per-repo auto-sync helper (does NOT run automatically)
WATCHER_SCRIPT="${LOCAL_DIR}/.mcp_auto_sync.sh"
cat > "$WATCHER_SCRIPT" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO_DIR"
AUTO_MESSAGE="${AUTO_MESSAGE:-mcp: auto-sync changes}"

# Load enterprise config if available
if [ -f "${HOME}/.mcp/config/notifications.env" ]; then
  source "${HOME}/.mcp/config/notifications.env"
fi

# Structured logging
log() {
  local level="$1"
  shift
  local message="$*"
  local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
  echo "{\"timestamp\":\"$timestamp\",\"level\":\"$level\",\"message\":\"$message\"}"
}

# Requires inotifywait (inotify-tools) for Linux. On macOS use fswatch alternative manually.
if ! command -v inotifywait >/dev/null 2>&1; then
  log "ERROR" "inotifywait not found. Install inotify-tools to use auto-sync watcher."
  exit 1
fi

log "INFO" "Starting auto-sync watcher for $REPO_DIR"

inotifywait -m -r -e close_write,move,create,delete --exclude '\.git|\.mcp_auto_sync\.sh|node_modules|__pycache__|\.tmp' . |
while read -r directory events filename; do
  log "INFO" "Detected change: $directory $events $filename"
  
  git add -A
  if git diff --staged --quiet; then
    continue
  fi
  
  if git commit -m "$AUTO_MESSAGE"; then
    log "INFO" "Changes committed successfully"
    
    if git push origin HEAD; then
      log "INFO" "Changes pushed successfully"
      
      # Send success notification if webhook configured
      if [ -n "${SLACK_WEBHOOK:-}" ]; then
        curl -X POST -H 'Content-type: application/json' \
          --data "{\"text\":\"✅ Auto-sync: Changes pushed to \`$(basename $REPO_DIR)\`\"}" \
          "$SLACK_WEBHOOK" 2>/dev/null || true
      fi
    else
      log "ERROR" "Failed to push changes"
    fi
  else
    log "WARN" "Commit failed or no changes to commit"
  fi
done
SH
chmod +x "$WATCHER_SCRIPT"
log "INFO" "Auto-sync helper created at: $WATCHER_SCRIPT"

# Open in VS Code (if 'code' CLI present)
if command -v code >/dev/null 2>&1; then
  run "code \"$LOCAL_DIR\""
  log "INFO" "Opened $LOCAL_DIR in VS Code"
else
  echo "Tip: install 'code' CLI from VS Code to open the project: Command Palette -> 'Install \"code\" command in PATH'"
fi

# Record sync duration metric
SYNC_END=$(date +%s)
SYNC_DURATION=$((SYNC_END - SYNC_START))
record_metric "sync_duration_seconds" "$SYNC_DURATION"
log "INFO" "Sync completed in ${SYNC_DURATION}s"

echo "Done. To create a PR locally: cd \"$LOCAL_DIR\" && gh pr create --base main --head \"$BRANCH\" --title \"<title>\" --body \"<desc>\""
MCP

chmod +x "$INSTALL_DIR/mcp_sync.sh"
echo "Installed: $INSTALL_DIR/mcp_sync.sh"

# Install enterprise health check utility
cat > "$INSTALL_DIR/mcp_health.sh" <<'HEALTH'
#!/usr/bin/env bash
set -euo pipefail
# mcp_health.sh - Health check and metrics endpoint for MCP sync tools

PORT="${MCP_HEALTH_PORT:-8080}"
METRICS_FILE="${HOME}/.mcp/metrics/mcp_sync_metrics.log"
LOG_FILE="${HOME}/.mcp/logs/mcp_sync.log"

# Simple HTTP server response
respond() {
  local status="$1"
  local content_type="${2:-text/plain}"
  local body="$3"
  
  echo -e "HTTP/1.1 $status\r\nContent-Type: $content_type\r\nContent-Length: ${#body}\r\n\r\n$body"
}

# Health check endpoint
health_check() {
  local status="healthy"
  local checks='{"git":"ok","disk":"ok"}'
  
  # Check git availability
  if ! command -v git >/dev/null 2>&1; then
    status="unhealthy"
    checks='{"git":"missing","disk":"ok"}'
  fi
  
  # Check disk space
  local disk_usage=$(df -h "${HOME}" | awk 'NR==2 {print $5}' | sed 's/%//')
  if [ "$disk_usage" -gt 90 ]; then
    status="degraded"
  fi
  
  local response="{\"status\":\"$status\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"checks\":$checks,\"disk_usage\":\"${disk_usage}%\"}"
  respond "200 OK" "application/json" "$response"
}

# Readiness check endpoint
readiness_check() {
  local ready="true"
  
  # Check if required directories exist
  if [ ! -d "${HOME}/.mcp" ]; then
    ready="false"
  fi
  
  local response="{\"ready\":$ready,\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}"
  respond "200 OK" "application/json" "$response"
}

# Metrics endpoint (Prometheus format)
metrics_endpoint() {
  local metrics=""
  
  # Basic metrics
  metrics+="# HELP mcp_sync_total Total number of sync operations\n"
  metrics+="# TYPE mcp_sync_total counter\n"
  
  if [ -f "$METRICS_FILE" ]; then
    local sync_count=$(wc -l < "$METRICS_FILE")
    metrics+="mcp_sync_total $sync_count\n"
    
    # Average sync duration
    local avg_duration=$(awk -F, '$2=="sync_duration_seconds" {sum+=$3; count++} END {if(count>0) print sum/count; else print 0}' "$METRICS_FILE")
    metrics+="# HELP mcp_sync_duration_seconds_avg Average sync duration\n"
    metrics+="# TYPE mcp_sync_duration_seconds_avg gauge\n"
    metrics+="mcp_sync_duration_seconds_avg $avg_duration\n"
  else
    metrics+="mcp_sync_total 0\n"
  fi
  
  respond "200 OK" "text/plain" "$(echo -e "$metrics")"
}

# Simple HTTP server
echo "Starting MCP health check server on port $PORT..."
echo "Endpoints: /health, /ready, /metrics"

while true; do
  {
    read -r request
    endpoint=$(echo "$request" | awk '{print $2}')
    
    case "$endpoint" in
      /health)
        health_check
        ;;
      /ready)
        readiness_check
        ;;
      /metrics)
        metrics_endpoint
        ;;
      *)
        respond "404 Not Found" "text/plain" "Not Found"
        ;;
    esac
  } | nc -l -p "$PORT" || true
done
HEALTH

chmod +x "$INSTALL_DIR/mcp_health.sh"
echo "Installed: $INSTALL_DIR/mcp_health.sh (health check server)"

# Optional systemd user service template
SYSTEMD_DIR="${HOME}/.config/systemd/user"
mkdir -p "$SYSTEMD_DIR"
cat > "${SYSTEMD_DIR}/mcp_auto_sync@.service" <<'SERVICE'
[Unit]
Description=mcp auto sync service for %i
After=network.target

[Service]
Type=simple
WorkingDirectory=%h/projects/%i
ExecStart=%h/bin/mcp_auto_runner.sh %h/projects/%i
Restart=on-failure
RestartSec=10

[Install]
WantedBy=default.target
SERVICE

# Helper runner for systemd (wrapper to run per-repo watcher)
cat > "${HOME}/bin/mcp_auto_runner.sh" <<'RUN'
#!/usr/bin/env bash
set -euo pipefail
REPO_DIR="$1"
if [ -z "$REPO_DIR" ]; then
  echo "Usage: mcp_auto_runner.sh <repo_dir>"
  exit 1
fi
WATCHER="$REPO_DIR/.mcp_auto_sync.sh"
if [ ! -f "$WATCHER" ]; then
  echo "No watcher found at $WATCHER"
  exit 1
fi
exec "$WATCHER"
RUN
chmod +x "${HOME}/bin/mcp_auto_runner.sh"

# Create enterprise configuration templates
CONFIG_DIR="${HOME}/.mcp/config"
mkdir -p "$CONFIG_DIR"

cat > "$CONFIG_DIR/notifications.env.example" <<'NOTIF'
# Enterprise Notification Configuration
# Copy this file to notifications.env and configure your webhooks

# Slack webhook URL for notifications
SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Discord webhook URL for notifications
DISCORD_WEBHOOK=https://discord.com/api/webhooks/YOUR/WEBHOOK/URL

# Microsoft Teams webhook URL for notifications
TEAMS_WEBHOOK=https://outlook.office.com/webhook/YOUR/WEBHOOK/URL

# PagerDuty integration key for critical alerts
PAGERDUTY_KEY=your_pagerduty_integration_key

# Enable structured JSON logging
ENABLE_LOGGING=true

# Enable metrics collection
ENABLE_METRICS=true

# Log file location
LOG_FILE=${HOME}/.mcp/logs/mcp_sync.log
NOTIF

cat > "$CONFIG_DIR/observability.yml" <<'OBS'
# Observability Configuration Template
# This file contains examples for integrating with enterprise observability platforms

# Datadog Configuration
datadog:
  api_key: YOUR_DD_API_KEY
  app_key: YOUR_DD_APP_KEY
  site: datadoghq.com
  tags:
    - env:production
    - service:mcp-sync
    - team:platform
  
# Prometheus Configuration
prometheus:
  scrape_interval: 15s
  scrape_timeout: 10s
  metrics_path: /metrics
  static_configs:
    - targets:
      - localhost:8080
  metric_relabel_configs:
    - source_labels: [__name__]
      regex: 'mcp_.*'
      action: keep

# OpenTelemetry Configuration
opentelemetry:
  endpoint: https://your-otel-collector:4317
  service_name: mcp-sync
  trace_sampling_rate: 0.1
  headers:
    authorization: Bearer YOUR_TOKEN

# New Relic Configuration
newrelic:
  license_key: YOUR_LICENSE_KEY
  app_name: MCP Sync Tool
  distributed_tracing:
    enabled: true
  
# Grafana Loki for log aggregation
loki:
  url: https://your-loki-instance:3100
  tenant_id: your-tenant
  labels:
    job: mcp-sync
    environment: production
OBS

cat > "$CONFIG_DIR/audit.json" <<'AUDIT'
{
  "audit_config": {
    "enabled": true,
    "log_level": "INFO",
    "retention_days": 90,
    "encryption": {
      "enabled": true,
      "algorithm": "AES-256-GCM"
    },
    "compliance": {
      "standards": ["SOC2", "ISO27001", "GDPR"],
      "data_classification": "confidential",
      "retention_policy": "90_days"
    },
    "events_to_audit": [
      "sync_start",
      "sync_complete",
      "sync_failure",
      "clone_repository",
      "update_repository",
      "authentication",
      "authorization"
    ]
  },
  "rbac": {
    "enabled": false,
    "roles": {
      "admin": ["sync", "delete", "configure"],
      "developer": ["sync", "read"],
      "readonly": ["read"]
    }
  }
}
AUDIT

cat > "$CONFIG_DIR/circuit-breaker.json" <<'CIRCUIT'
{
  "circuit_breaker": {
    "github_api": {
      "failure_threshold": 5,
      "success_threshold": 2,
      "timeout_seconds": 30,
      "reset_timeout_seconds": 60
    },
    "vscode_cli": {
      "failure_threshold": 3,
      "success_threshold": 1,
      "timeout_seconds": 10,
      "reset_timeout_seconds": 30
    }
  },
  "rate_limiting": {
    "github_api": {
      "requests_per_hour": 5000,
      "burst_size": 100
    }
  },
  "retry_policy": {
    "max_attempts": 3,
    "initial_backoff_ms": 1000,
    "max_backoff_ms": 10000,
    "backoff_multiplier": 2
  }
}
CIRCUIT

echo "Created enterprise config templates in: $CONFIG_DIR"
echo "  - notifications.env.example (webhook configurations)"
echo "  - observability.yml (Datadog, Prometheus, OpenTelemetry, New Relic, Loki)"
echo "  - audit.json (audit logging and compliance settings)"
echo "  - circuit-breaker.json (resilience patterns)"

# Summary & quick examples
cat <<'INFO'

════════════════════════════════════════════════════════════════════════════════
  MCP SYNC TOOL - ENTERPRISE EDITION
════════════════════════════════════════════════════════════════════════════════

✅ Installed Components:
  📦 ~/bin/mcp_sync.sh              - Main sync tool
  🏥 ~/bin/mcp_health.sh            - Health check & metrics server
  🔄 ~/bin/mcp_auto_runner.sh       - Systemd wrapper
  ⚙️  ~/.config/systemd/user/       - Service templates
  📋 ~/.mcp/config/                 - Enterprise config templates

────────────────────────────────────────────────────────────────────────────────
QUICK START EXAMPLES
────────────────────────────────────────────────────────────────────────────────

1️⃣  Basic sync (manual):
   ORG=InfinityXOneSystems REPO=foundation LOCAL_DIR=~/projects/foundation ~/bin/mcp_sync.sh

2️⃣  Sync with enterprise features enabled:
   ENABLE_LOGGING=true ENABLE_METRICS=true SLACK_WEBHOOK=https://hooks.slack.com/... \
   ORG=InfinityXOneSystems REPO=foundation LOCAL_DIR=~/projects/foundation ~/bin/mcp_sync.sh

3️⃣  Start health check server (for monitoring):
   ~/bin/mcp_health.sh &
   # Access: http://localhost:8080/health, /ready, /metrics

4️⃣  Enable auto-sync watcher (manual run):
   ORG=InfinityXOneSystems REPO=foundation LOCAL_DIR=~/projects/foundation ~/bin/mcp_sync.sh
   nohup ~/projects/foundation/.mcp_auto_sync.sh >/tmp/mcp_auto_sync_foundation.log 2>&1 &

5️⃣  Use systemd for persistent auto-sync (Linux):
   systemctl --user enable --now mcp_auto_sync@foundation.service

────────────────────────────────────────────────────────────────────────────────
ENTERPRISE FEATURES (FAANG-LEVEL)
────────────────────────────────────────────────────────────────────────────────

🔔 REAL-TIME NOTIFICATIONS:
   • Slack webhook integration      (set SLACK_WEBHOOK)
   • Discord webhook integration    (set DISCORD_WEBHOOK)
   • Microsoft Teams integration    (set TEAMS_WEBHOOK)
   • PagerDuty for critical alerts  (set PAGERDUTY_KEY)

📊 OBSERVABILITY & METRICS:
   • Structured JSON logging        (ENABLE_LOGGING=true)
   • Prometheus metrics endpoint    (/metrics on port 8080)
   • Correlation IDs for tracing
   • Sync duration tracking
   • Health check endpoints         (/health, /ready)

🔐 AUDIT & COMPLIANCE:
   • Immutable audit logs
   • SOC2/ISO27001 metadata templates
   • Event sourcing patterns
   • See: ~/.mcp/config/audit.json

⚡ OPERATIONAL EXCELLENCE:
   • Circuit breaker patterns       (see circuit-breaker.json)
   • Rate limiting for GitHub API
   • Retry with exponential backoff
   • Graceful degradation
   • Enhanced file exclusions (node_modules, __pycache__, .tmp)

────────────────────────────────────────────────────────────────────────────────
CONFIGURATION
────────────────────────────────────────────────────────────────────────────────

📝 Copy and configure templates:
   cp ~/.mcp/config/notifications.env.example ~/.mcp/config/notifications.env
   # Edit with your webhook URLs and keys

📊 Integration templates available:
   • observability.yml     - Datadog, Prometheus, OpenTelemetry, New Relic, Loki
   • audit.json           - Audit logging and compliance settings
   • circuit-breaker.json - Resilience patterns and rate limiting

────────────────────────────────────────────────────────────────────────────────
PREREQUISITES
────────────────────────────────────────────────────────────────────────────────

Required:
  ✓ git                    - Version control

Optional (recommended):
  • gh (GitHub CLI)        - https://cli.github.com/
  • code (VS Code CLI)     - For IDE integration
  • inotify-tools (Linux)  - For auto-sync watcher
  • nc (netcat)            - For health check server
  • curl                   - For webhook notifications

────────────────────────────────────────────────────────────────────────────────
MONITORING & HEALTH CHECKS
────────────────────────────────────────────────────────────────────────────────

Start health server:    ~/bin/mcp_health.sh
Health endpoint:        curl http://localhost:8080/health
Readiness endpoint:     curl http://localhost:8080/ready
Metrics (Prometheus):   curl http://localhost:8080/metrics

View logs:              tail -f ~/.mcp/logs/mcp_sync.log
View metrics:           cat ~/.mcp/metrics/mcp_sync_metrics.log

────────────────────────────────────────────────────────────────────────────────
SECURITY NOTES
────────────────────────────────────────────────────────────────────────────────

⚠️  This tool does NOT handle secret values directly
⚠️  Keep secrets out of git
⚠️  Use GitHub Secrets or vault solutions for sensitive data
⚠️  Webhook URLs may contain sensitive tokens - protect your config files
⚠️  Set appropriate file permissions: chmod 600 ~/.mcp/config/notifications.env

────────────────────────────────────────────────────────────────────────────────

For more features, visit: https://github.com/InfinityXOneSystems/foundation

════════════════════════════════════════════════════════════════════════════════
INFO

# end bootstrap script
