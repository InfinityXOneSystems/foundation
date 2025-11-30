#!/usr/bin/env pwsh
# scripts/start.ps1 — Start Infinity X Automation Orchestrator (Windows)

Write-Host "[AUTO ALL v2] Starting Infinity X Orchestrator..."

# Ensure Node.js is available
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js is required. Please install Node.js (LTS) and try again."
    exit 1
}

# Start orchestrator
npx ts-node "$PSScriptRoot/../orchestrator.ts"
