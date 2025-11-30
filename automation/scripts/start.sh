#!/bin/bash
# scripts/start.sh — Start Infinity X Automation Orchestrator (Linux/macOS/WSL)

echo "[AUTO ALL v2] Starting Infinity X Orchestrator..."

# Ensure Node.js is available
if ! command -v node &> /dev/null; then
  echo "Node.js is required. Please install Node.js (LTS) and try again."
  exit 1
fi

# Start orchestrator
npx ts-node "$(dirname "$0")/../orchestrator.ts"
