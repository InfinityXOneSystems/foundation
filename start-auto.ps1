#!/usr/bin/env pwsh
# start-auto.ps1 — Start Infinity X AUTO ALL Orchestrator (Windows)

Write-Host "[AUTO ALL] Starting Infinity X Orchestrator..."

# Ensure Node.js is available
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js is required. Please install Node.js (LTS) and try again."
    exit 1
}

# Start orchestrator
node ./auto-orchestrator.js
