#!/bin/bash
# scripts/sync-env.sh
# Sync .env.local with a remote location (customize REMOTE_DEST as needed)

set -e

REMOTE_DEST="user@yourserver:/path/to/env-backups/.env.local" # <-- customize this

case "$1" in
  push)
    echo "Pushing .env.local to remote..."
    scp .env.local "$REMOTE_DEST"
    ;;
  pull)
    echo "Pulling .env.local from remote..."
    scp "$REMOTE_DEST" .env.local
    ;;
  *)
    echo "Usage: $0 [push|pull]"
    exit 1
    ;;
esac
