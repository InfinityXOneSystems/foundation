param(
  [string]$Namespace = "control-plane",
  [string]$Release = "control-plane",
  [string]$ChartPath = "../helm/control-plane",
  [string]$Values = "../helm/control-plane/values.production.yaml"
)

function Ensure-Namespace {
  param([string]$Name)
  $exists = kubectl get ns $Name -o name 2>$null
  if (-not $exists) { kubectl create ns $Name | Out-Null }
}

function Helm-Deploy {
  param([string]$Rel,[string]$Chart,[string]$Ns,[string]$Vals)
  helm upgrade --install $Rel $Chart -n $Ns -f $Vals
}

function Wait-Ready {
  param([string]$Ns,[string]$Rel,[int]$TimeoutSec = 120)
  $start = Get-Date
  while ((Get-Date) - $start).TotalSeconds -lt $TimeoutSec) {
    $status = kubectl -n $Ns get deploy/$Rel -o json 2>$null | ConvertFrom-Json
    if ($status.status.readyReplicas -ge 1) { return }
    Start-Sleep -Seconds 3
  }
  throw "Deployment $Rel not ready in namespace $Ns within $TimeoutSec seconds"
}

function Verify-Endpoints {
  param([string]$Ns,[string]$Rel)
  $pf = Start-Process -FilePath "kubectl" -ArgumentList "-n",$Ns,"port-forward","deploy/$Rel","8080:8080" -NoNewWindow -PassThru
  Start-Sleep -Seconds 2
  try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:8080/healthz" -Method Get -TimeoutSec 5
    Write-Host "Healthz: $health" -ForegroundColor Green
    $metrics = Invoke-WebRequest -Uri "http://127.0.0.1:8080/metrics" -Method Get -TimeoutSec 5
    Write-Host "Metrics received (${metrics.Content.Length} bytes)" -ForegroundColor Green
  } finally {
    if ($pf -and $pf.HasExited -eq $false) { Stop-Process -Id $pf.Id -Force }
  }
}

Write-Host "Ensuring namespace '$Namespace'" -ForegroundColor Cyan
Ensure-Namespace -Name $Namespace

Write-Host "Deploying Helm release '$Release'" -ForegroundColor Cyan
Helm-Deploy -Rel $Release -Chart $ChartPath -Ns $Namespace -Vals $Values

Write-Host "Waiting for readiness" -ForegroundColor Cyan
Wait-Ready -Ns $Namespace -Rel $Release

Write-Host "Verifying endpoints via port-forward" -ForegroundColor Cyan
Verify-Endpoints -Ns $Namespace -Rel $Release

Write-Host "Deployment verified. Release: $Release Namespace: $Namespace" -ForegroundColor Yellow
