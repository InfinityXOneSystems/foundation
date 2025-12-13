# Health check script for JARVIS Foundation
param(
    [string]$LogPath = "C:\JARVIS\Workspace\logs\health-check.log"
)

function Write-HealthLog {
    param([string]$Message, [string]$Status)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Add-Content -Path $LogPath -Value "[$timestamp] [$Status] $Message"
}

# Check Git Sync Service
$syncService = Get-Service -Name "JARVISFoundationSync" -ErrorAction SilentlyContinue
if ($syncService -and $syncService.Status -eq "Running") {
    Write-HealthLog "Git Sync Service:  HEALTHY" "OK"
}
elseif ($syncService) {
    Write-HealthLog "Git Sync Service: NOT RUNNING - Attempting restart" "CRITICAL"
    Restart-Service -Name "JARVISFoundationSync" -Force
}
else {
    Write-HealthLog "Git Sync Service:  NOT INSTALLED" "WARN"
}

# Check GitHub Actions Runner
$runnerService = Get-Service -Name "actions. runner.*" -ErrorAction SilentlyContinue
if ($runnerService -and $runnerService.Status -eq "Running") {
    Write-HealthLog "GitHub Actions Runner: HEALTHY" "OK"
}
elseif ($runnerService) {
    Write-HealthLog "GitHub Actions Runner: NOT RUNNING - Attempting restart" "CRITICAL"
    Restart-Service -Name $runnerService.Name -Force
}
else {
    Write-HealthLog "GitHub Actions Runner: NOT INSTALLED" "WARN"
}

# Check repository status
Set-Location "C:\JARVIS\Workspace\documents\foundation"
$gitStatus = git status 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-HealthLog "Repository Status:  HEALTHY" "OK"
}
else {
    Write-HealthLog "Repository Status: ERROR - $gitStatus" "CRITICAL"
}

# Check disk space on C:
$drive = Get-PSDrive -Name C
$freeSpaceGB = [math]::Round($drive.Free / 1GB, 2)
if ($freeSpaceGB -gt 10) {
    Write-HealthLog "Disk Space: ${freeSpaceGB}GB available - HEALTHY" "OK"
}
else {
    Write-HealthLog "Disk Space: ${freeSpaceGB}GB available - LOW SPACE WARNING" "WARN"
}

Write-HealthLog "Health check completed" "OK"
