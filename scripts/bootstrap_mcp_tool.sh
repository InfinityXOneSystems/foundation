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

# Prechecks
if ! command -v gh >/dev/null 2>&1; then
  echo "WARNING: gh (GitHub CLI) not found. Install: https://cli.github.com/ and run 'gh auth login' before using full features."
fi
if ! command -v git >/dev/null 2>&1; then
  echo "BLOCKER: git is required. Install git and re-run."
  exit 2
fi

echo "mcp_sync: org=$ORG repo=$REPO branch=$BRANCH local=$LOCAL_DIR"

# Clone or update
if [ -d "$LOCAL_DIR/.git" ]; then
  echo "Local repo exists, fetching updates..."
  run "git -C \"$LOCAL_DIR\" fetch --all --prune"
  run "git -C \"$LOCAL_DIR\" checkout \"$BRANCH\" || git -C \"$LOCAL_DIR\" checkout -b \"$BRANCH\" origin/$BRANCH || true"
  run "git -C \"$LOCAL_DIR\" pull --rebase"
else
  echo "Cloning https://github.com/${ORG}/${REPO}.git to $LOCAL_DIR"
  run "mkdir -p \"$(dirname \"$LOCAL_DIR\")\""
  run "git clone https://github.com/${ORG}/${REPO}.git \"$LOCAL_DIR\""
  run "git -C \"$LOCAL_DIR\" checkout -B \"$BRANCH\" || true"
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
# Requires inotifywait (inotify-tools) for Linux. On macOS use fswatch alternative manually.
if ! command -v inotifywait >/dev/null 2>&1; then
  echo "inotifywait not found. Install inotify-tools to use auto-sync watcher."
  exit 1
fi
inotifywait -m -r -e close_write,move,create,delete --exclude '\.git|\.mcp_auto_sync\.sh' . |
while read -r directory events filename; do
  git add -A
  if git diff --staged --quiet; then
    continue
  fi
  git commit -m "$AUTO_MESSAGE" || true
  git push origin HEAD || true
done
SH
chmod +x "$WATCHER_SCRIPT"
echo "Auto-sync helper created at: $WATCHER_SCRIPT (run manually if you want automatic pushes)"

# Open in VS Code (if 'code' CLI present)
if command -v code >/dev/null 2>&1; then
  run "code \"$LOCAL_DIR\""
  echo "Opened $LOCAL_DIR in VS Code"
else
  echo "Tip: install 'code' CLI from VS Code to open the project: Command Palette -> 'Install \"code\" command in PATH'"
fi

echo "Done. To create a PR locally: cd \"$LOCAL_DIR\" && gh pr create --base main --head \"$BRANCH\" --title \"<title>\" --body \"<desc>\""
MCP

chmod +x "$INSTALL_DIR/mcp_sync.sh"
echo "Installed: $INSTALL_DIR/mcp_sync.sh"

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

# Summary & quick examples
cat <<'INFO'

mcp tool installed at: ~/bin/mcp_sync.sh

Quick examples (copy/paste one):

1) Clone & open a repo in VS Code (manual):
   ORG=InfinityXOneSystems REPO=foundation LOCAL_DIR=~/projects/foundation ~/bin/mcp_sync.sh

2) Clone and enable autosync helper (manual run):
   ORG=InfinityXOneSystems REPO=foundation LOCAL_DIR=~/projects/foundation ~/bin/mcp_sync.sh
   # then run watcher manually (in that repo):
   nohup ~/projects/foundation/.mcp_auto_sync.sh >/tmp/mcp_auto_sync_foundation.log 2>&1 &

3) If using systemd user units (Linux):
   # enable and start a watcher for repo 'foundation' (after cloning to ~/projects/foundation)
   systemctl --user enable --now mcp_auto_sync@foundation.service

Mobile phone notes (you don't have to add your phone):
- You do NOT need to add your phone to run this tool.
- Install GitHub mobile app to receive PR/issue notifications and review quickly from your phone.
- If you want to edit code on your phone, consider using GitHub Codespaces or code-server (not provisioned by this script).

Prerequisites (install if missing):
- git (required)
- gh (recommended for PR creation & advanced features): https://cli.github.com/
- code (VS Code CLI) if you want "open in VS Code" to work
- inotify-tools (for Linux AUTO watcher) or an equivalent file-watcher on macOS

Security reminder:
- This tool does NOT handle secret values. Keep secrets out of git. Use GitHub Secrets or the env-sync workflows you prepared elsewhere.

If you want me to also:
- create an inventory-driven PR helper that adds/updates env files and opens PRs automatically, reply: PROVIDE_INVENTORY_PR
- produce systemd install commands and enable the service for you, reply: PROVIDE_SYSTEMD
- create a Codespaces or code-server guide for mobile editing, reply: PROVIDE_CODESPACES

DONE
INFO

# end bootstrap script
