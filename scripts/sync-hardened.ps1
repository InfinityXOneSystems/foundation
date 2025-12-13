<#
.SYNOPSIS
    Enterprise-Grade Hardened Bidirectional Git Sync for JARVIS Foundation
#>

param(
    [string]$RepoPath = "C:\JARVIS\Workspace\documents\foundation",
    [string]$Remote = "origin",
    [string]$Branch = "master",
    [ValidateSet("merge", "rebase")]
    [string]$Strategy = "merge",
    [int]$IntervalSeconds = 300,
    [int]$MaxRetries = 5,
    [switch]$AutoCommit,
    [string]$LogPath = "C:\JARVIS\Workspace\logs\git-sync.log"
)

# Ensure log directory exists
New-Item -ItemType Directory -Force -Path "C:\JARVIS\Workspace\logs" | Out-Null

# Logging function
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    Add-Content -Path $LogPath -Value $logMessage
    
    switch ($Level) {
        "ERROR" { Write-Host $logMessage -ForegroundColor Red }
        "WARN" { Write-Host $logMessage -ForegroundColor Yellow }
        "SUCCESS" { Write-Host $logMessage -ForegroundColor Green }
        default { Write-Host $logMessage -ForegroundColor Cyan }
    }
}

# Retry logic with exponential backoff
function Invoke-WithRetry {
    param(
        [scriptblock]$ScriptBlock,
        [int]$MaxRetries = 5,
        [int]$InitialDelay = 2
    )
    
    $attempt = 0
    $delay = $InitialDelay
    
    while ($attempt -lt $MaxRetries) {
        try {
            $attempt++
            Write-Log "Attempt $attempt of $MaxRetries..." "INFO"
            $result = & $ScriptBlock
            Write-Log "Success on attempt $attempt" "SUCCESS"
            return $result
        }
        catch {
            Write-Log "Attempt $attempt failed: $_" "WARN"
            if ($attempt -ge $MaxRetries) {
                Write-Log "Max retries reached.  Operation failed." "ERROR"
                throw
            }
            Write-Log "Waiting $delay seconds before retry..." "INFO"
            Start-Sleep -Seconds $delay
            $delay *= 2
        }
    }
}

# Health check
function Test-RepoHealth {
    param([string]$Path)
    
    if (-not (Test-Path "$Path\.git")) {
        Write-Log "Not a Git repository:  $Path" "ERROR"
        return $false
    }
    
    Push-Location $Path
    try {
        git status 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Git status check failed" "ERROR"
            return $false
        }
        
        git ls-remote $Remote HEAD 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Remote connectivity check failed" "ERROR"
            return $false
        }
        
        Write-Log "Repository health check passed" "SUCCESS"
        return $true
    }
    finally {
        Pop-Location
    }
}

# Sync function
function Invoke-GitSync {
    param([string]$Path)
    
    Push-Location $Path
    try {
        Write-Log "=== Starting sync cycle ===" "INFO"
        
        # Check for uncommitted changes
        $hasChanges = (git status --porcelain).Length -gt 0
        
        if ($hasChanges) {
            if ($AutoCommit) {
                Write-Log "Auto-committing changes..." "INFO"
                git add -A
                $commitMsg = "auto-sync: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
                git commit -m $commitMsg
                Write-Log "Changes committed: $commitMsg" "SUCCESS"
            }
            else {
                Write-Log "Stashing uncommitted changes..." "INFO"
                git stash push -m "auto-stash-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
            }
        }
        
        # Fetch latest
        Write-Log "Fetching from $Remote..." "INFO"
        Invoke-WithRetry -ScriptBlock { git fetch $Remote --prune } -MaxRetries $MaxRetries
        
        # Get commit counts
        $ahead = (git rev-list "$Remote/$Branch.. $Branch" --count)
        $behind = (git rev-list "$Branch..$Remote/$Branch" --count)
        
        Write-Log "Local:  +$ahead commits, Remote: +$behind commits" "INFO"
        
        # Pull if behind
        if ($behind -gt 0) {
            Write-Log "Pulling $behind commits with $Strategy strategy..." "INFO"
            
            if ($Strategy -eq "rebase") {
                Invoke-WithRetry -ScriptBlock { git pull --rebase $Remote $Branch } -MaxRetries 3
            }
            else {
                Invoke-WithRetry -ScriptBlock { git pull $Remote $Branch } -MaxRetries 3
            }
            
            Write-Log "Pull completed successfully" "SUCCESS"
        }
        
        # Push if ahead
        if ($ahead -gt 0) {
            Write-Log "Pushing $ahead commits..." "INFO"
            Invoke-WithRetry -ScriptBlock { git push $Remote $Branch } -MaxRetries $MaxRetries
            Write-Log "Push completed successfully" "SUCCESS"
        }
        
        # Pop stash if needed
        $stashList = git stash list
        if ($stashList -and -not $AutoCommit) {
            Write-Log "Restoring stashed changes..." "INFO"
            git stash pop
        }
        
        Write-Log "=== Sync cycle completed ===" "SUCCESS"
        return $true
    }
    catch {
        Write-Log "Sync failed: $_" "ERROR"
        
        # Attempt recovery
        Write-Log "Attempting recovery..." "WARN"
        git merge --abort 2>$null
        git rebase --abort 2>$null
        
        return $false
    }
    finally {
        Pop-Location
    }
}

# Main loop
Write-Log "========================================" "INFO"
Write-Log "JARVIS Foundation Hardened Git Sync Started" "INFO"
Write-Log "Repository: $RepoPath" "INFO"
Write-Log "Remote: $Remote" "INFO"
Write-Log "Branch: $Branch" "INFO"
Write-Log "Strategy: $Strategy" "INFO"
Write-Log "Interval: $IntervalSeconds seconds" "INFO"
Write-Log "Auto-Commit: $AutoCommit" "INFO"
Write-Log "========================================" "INFO"

# Initial health check
if (-not (Test-RepoHealth -Path $RepoPath)) {
    Write-Log "Initial health check failed.  Exiting." "ERROR"
    exit 1
}

# Main sync loop
$consecutiveFailures = 0
$maxConsecutiveFailures = 3

while ($true) {
    try {
        if (-not (Test-RepoHealth -Path $RepoPath)) {
            $consecutiveFailures++
            Write-Log "Health check failed ($consecutiveFailures/$maxConsecutiveFailures)" "WARN"
            
            if ($consecutiveFailures -ge $maxConsecutiveFailures) {
                Write-Log "Max consecutive failures reached.  Exiting." "ERROR"
                exit 1
            }
        }
        else {
            $consecutiveFailures = 0
            $syncResult = Invoke-GitSync -Path $RepoPath
            
            if (-not $syncResult) {
                $consecutiveFailures++
            }
        }
        
        Write-Log "Waiting $IntervalSeconds seconds until next sync..." "INFO"
        Start-Sleep -Seconds $IntervalSeconds
    }
    catch {
        Write-Log "Fatal error in main loop: $_" "ERROR"
        $consecutiveFailures++
        
        if ($consecutiveFailures -ge $maxConsecutiveFailures) {
            Write-Log "Exiting due to repeated failures" "ERROR"
            exit 1
        }
        
        Start-Sleep -Seconds 60
    }
}
