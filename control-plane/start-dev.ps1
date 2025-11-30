param(
  [int]$PreferredPort = 8081
)

function Get-FreePort {
  param([int]$StartPort)
  for ($p = $StartPort; $p -le ($StartPort + 50); $p++) {
    $inUse = (Get-NetTCPConnection -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq $p }).Count -gt 0
    if (-not $inUse) { return $p }
  }
  throw "No free port found near $StartPort"
}

$port = Get-FreePort -StartPort $PreferredPort
$env:PORT = "$port"
Write-Host "Starting control plane on port $port" -ForegroundColor Cyan

# Ensure deps
if (-not (Test-Path "package.json")) { throw "Run from control-plane folder" }
if (-not (Test-Path "node_modules")) { npm install }

# Start in background job
$job = Start-Job -ScriptBlock { npx tsx src/server.ts }
Start-Sleep -Seconds 2

# Probe health and metrics
try {
  $health = Invoke-RestMethod -Uri "http://127.0.0.1:$port/healthz" -Method Get -TimeoutSec 5
  Write-Host "Healthz: $health" -ForegroundColor Green
} catch { Write-Warning "Health check failed: $($_.Exception.Message)" }

try {
  $metrics = Invoke-WebRequest -Uri "http://127.0.0.1:$port/metrics" -Method Get -TimeoutSec 5
  Write-Host "Metrics received (${metrics.Content.Length} bytes)" -ForegroundColor Green
} catch { Write-Warning "Metrics check failed: $($_.Exception.Message)" }

Write-Host "Control plane job Id: $($job.Id). Use Stop-Job -Id $($job.Id) to stop." -ForegroundColor Yellow
