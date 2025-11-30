Param(
  [int]$Port = 8080
)

Write-Host "Validating local control plane on port $Port..."
try {
  $health = Invoke-WebRequest -Uri "http://localhost:$Port/healthz" -UseBasicParsing
  Write-Host "Healthz:" $health.StatusCode
  $metrics = Invoke-WebRequest -Uri "http://localhost:$Port/metrics" -UseBasicParsing
  Write-Host "Metrics length:" $metrics.Content.Length
  $job = Invoke-RestMethod -Method Post -Uri "http://localhost:$Port/v1/commands" -ContentType "application/json" -Body (@{} | ConvertTo-Json)
  Write-Host "Job created:" $job.id
  $status = Invoke-RestMethod -Uri "http://localhost:$Port/v1/jobs/$($job.id)"
  Write-Host "Job status:" $status.status
} catch {
  Write-Error $_
  exit 1
}
Write-Host "Validation completed."
