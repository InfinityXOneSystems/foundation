#!/bin/bash
# start-auto.sh — Start Infinity X AUTO ALL Orchestrator (Linux/macOS/WSL)

echo "[AUTO ALL] Starting Infinity X Orchestrator..."

# Ensure Node.js is available
if ! command -v node &> /dev/null; then
  echo "Node.js is required. Please install Node.js (LTS) and try again."
  exit 1
fi

# Start orchestrator
node ./auto-orchestrator.js
