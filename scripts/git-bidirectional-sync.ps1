<#
.SYNOPSIS
    Bidirectional Git Synchronization Script
    
.DESCRIPTION
    Automatically synchronizes local and remote Git repositories with:
    - Fetch latest changes from remote
    - Pull with automatic merge/rebase
    - Push local commits
    - Conflict detection and resolution strategies
    - Stash management for uncommitted changes
    - Branch tracking and synchronization
    - Dry-run mode for safety
    
.PARAMETER Remote
    Remote name (default: origin)
    
.PARAMETER Branch
    Branch to sync (default: current branch)
    
.PARAMETER Strategy
    Merge strategy: merge, rebase, or fast-forward-only (default: merge)
    
.PARAMETER DryRun
    Preview changes without applying them
    
.PARAMETER AutoCommit
    Automatically commit uncommitted changes before sync
    
.PARAMETER Force
    Force push (use with caution)
    
.PARAMETER Interval
    Continuous sync interval in seconds (0 = one-time sync)
    
.EXAMPLE
    .\git-bidirectional-sync.ps1
    
.EXAMPLE
    .\git-bidirectional-sync.ps1 -Remote origin -Branch main -Strategy rebase
    
.EXAMPLE
    .\git-bidirectional-sync.ps1 -DryRun
    
.EXAMPLE
    .\git-bidirectional-sync.ps1 -Interval 300 -AutoCommit
#>

param(
    [string]$Remote = "origin",
    [string]$Branch = "",
    [ValidateSet("merge", "rebase", "fast-forward-only")]
    [string]$Strategy = "merge",
    [switch]$DryRun,
    [switch]$AutoCommit,
    [switch]$Force,
    [int]$Interval = 0
)

# Color output functions
function Write-Success { param([string]$Message) Write-Host "✓ $Message" -ForegroundColor Green }
function Write-Info { param([string]$Message) Write-Host "ℹ $Message" -ForegroundColor Cyan }
function Write-Warning { param([string]$Message) Write-Host "⚠ $Message" -ForegroundColor Yellow }
function Write-Error { param([string]$Message) Write-Host "✗ $Message" -ForegroundColor Red }
function Write-Step { param([string]$Message) Write-Host "→ $Message" -ForegroundColor Magenta }

# Check if in a Git repository
function Test-GitRepository {
    $gitDir = git rev-parse --git-dir 2>$null
    return $LASTEXITCODE -eq 0
}

# Get current branch
function Get-CurrentBranch {
    $branch = git rev-parse --abbrev-ref HEAD 2>$null
    if ($LASTEXITCODE -eq 0) {
        return $branch
    }
    return $null
}

# Get remote tracking branch
function Get-RemoteBranch {
    param([string]$LocalBranch)
    $remoteBranch = git rev-parse --abbrev-ref "$LocalBranch@{upstream}" 2>$null
    if ($LASTEXITCODE -eq 0) {
        return $remoteBranch
    }
    return "$Remote/$LocalBranch"
}

# Check if there are uncommitted changes
function Test-UncommittedChanges {
    git diff-index --quiet HEAD -- 2>$null
    return $LASTEXITCODE -ne 0
}

# Check if there are untracked files
function Test-UntrackedFiles {
    $untracked = git ls-files --others --exclude-standard
    return $untracked.Length -gt 0
}

# Get commit counts
function Get-CommitCounts {
    param([string]$LocalBranch, [string]$RemoteBranch)
    
    $ahead = git rev-list --count "$RemoteBranch..$LocalBranch" 2>$null
    $behind = git rev-list --count "$LocalBranch..$RemoteBranch" 2>$null
    
    return @{
        Ahead = if ($LASTEXITCODE -eq 0) { [int]$ahead } else { 0 }
        Behind = if ($LASTEXITCODE -eq 0) { [int]$behind } else { 0 }
    }
}

# Stash uncommitted changes
function Invoke-GitStash {
    param([string]$Message = "Auto-stash before sync")
    
    Write-Step "Stashing uncommitted changes..."
    git stash push -u -m $Message 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Changes stashed successfully"
        return $true
    } else {
        Write-Error "Failed to stash changes"
        return $false
    }
}

# Pop stashed changes
function Invoke-GitStashPop {
    Write-Step "Restoring stashed changes..."
    git stash pop 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Stashed changes restored"
        return $true
    } else {
        Write-Warning "Conflict while restoring stash - manual resolution required"
        return $false
    }
}

# Auto-commit uncommitted changes
function Invoke-AutoCommit {
    Write-Step "Auto-committing uncommitted changes..."
    
    git add -A
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    git commit -m "Auto-commit: $timestamp [bidirectional-sync]"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Changes committed automatically"
        return $true
    } else {
        Write-Error "Failed to auto-commit changes"
        return $false
    }
}

# Fetch from remote
function Invoke-GitFetch {
    Write-Step "Fetching from remote '$Remote'..."
    
    if ($DryRun) {
        Write-Info "[DRY RUN] Would fetch from $Remote"
        return $true
    }
    
    git fetch $Remote --prune --tags 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Fetched successfully"
        return $true
    } else {
        Write-Error "Failed to fetch from remote"
        return $false
    }
}

# Pull changes with specified strategy
function Invoke-GitPull {
    param([string]$LocalBranch, [string]$RemoteBranch)
    
    Write-Step "Pulling changes from '$RemoteBranch'..."
    
    if ($DryRun) {
        Write-Info "[DRY RUN] Would pull from $RemoteBranch using strategy: $Strategy"
        return $true
    }
    
    switch ($Strategy) {
        "merge" {
            git pull $Remote $LocalBranch --no-rebase 2>&1 | Out-Null
        }
        "rebase" {
            git pull $Remote $LocalBranch --rebase 2>&1 | Out-Null
        }
        "fast-forward-only" {
            git pull $Remote $LocalBranch --ff-only 2>&1 | Out-Null
        }
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Pulled successfully with strategy: $Strategy"
        return $true
    } else {
        Write-Error "Failed to pull changes (conflicts may exist)"
        return $false
    }
}

# Push changes to remote
function Invoke-GitPush {
    param([string]$LocalBranch)
    
    Write-Step "Pushing changes to '$Remote/$LocalBranch'..."
    
    if ($DryRun) {
        Write-Info "[DRY RUN] Would push to $Remote/$LocalBranch"
        return $true
    }
    
    if ($Force) {
        Write-Warning "Force pushing (use with caution!)"
        git push $Remote $LocalBranch --force-with-lease 2>&1 | Out-Null
    } else {
        git push $Remote $LocalBranch 2>&1 | Out-Null
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Pushed successfully"
        return $true
    } else {
        Write-Error "Failed to push changes"
        return $false
    }
}

# Check for merge conflicts
function Test-MergeConflicts {
    $conflicts = git diff --name-only --diff-filter=U
    return $conflicts.Length -gt 0
}

# Main synchronization logic
function Invoke-BidirectionalSync {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "  Git Bidirectional Sync" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    # Verify Git repository
    if (-not (Test-GitRepository)) {
        Write-Error "Not a Git repository"
        return $false
    }
    
    # Get current branch
    $currentBranch = if ($Branch) { $Branch } else { Get-CurrentBranch }
    if (-not $currentBranch) {
        Write-Error "Could not determine current branch"
        return $false
    }
    
    Write-Info "Branch: $currentBranch"
    Write-Info "Remote: $Remote"
    Write-Info "Strategy: $Strategy"
    if ($DryRun) { Write-Warning "DRY RUN MODE - No changes will be applied" }
    Write-Host ""
    
    # Get remote tracking branch
    $remoteBranch = Get-RemoteBranch -LocalBranch $currentBranch
    Write-Info "Tracking: $remoteBranch`n"
    
    # Check for uncommitted changes
    $hasUncommitted = Test-UncommittedChanges
    $hasUntracked = Test-UntrackedFiles
    $stashed = $false
    
    if ($hasUncommitted -or $hasUntracked) {
        Write-Warning "Uncommitted changes detected"
        
        if ($AutoCommit) {
            if (-not (Invoke-AutoCommit)) {
                return $false
            }
        } else {
            if (-not (Invoke-GitStash)) {
                Write-Error "Cannot sync with uncommitted changes. Use -AutoCommit or commit manually."
                return $false
            }
            $stashed = $true
        }
        Write-Host ""
    }
    
    # Step 1: Fetch
    if (-not (Invoke-GitFetch)) {
        if ($stashed) { Invoke-GitStashPop }
        return $false
    }
    
    # Get commit counts before sync
    $counts = Get-CommitCounts -LocalBranch $currentBranch -RemoteBranch $remoteBranch
    
    Write-Info "Commits ahead: $($counts.Ahead)"
    Write-Info "Commits behind: $($counts.Behind)`n"
    
    # Step 2: Pull if behind
    if ($counts.Behind -gt 0) {
        if (-not (Invoke-GitPull -LocalBranch $currentBranch -RemoteBranch $remoteBranch)) {
            if (Test-MergeConflicts) {
                Write-Error "Merge conflicts detected - manual resolution required"
                Write-Info "Conflicted files:"
                git diff --name-only --diff-filter=U | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
                Write-Host "`nResolve conflicts, then run: git add . && git commit" -ForegroundColor Yellow
            }
            if ($stashed) { Invoke-GitStashPop }
            return $false
        }
    } else {
        Write-Info "Local branch is up to date with remote`n"
    }
    
    # Step 3: Push if ahead
    if ($counts.Ahead -gt 0) {
        if (-not (Invoke-GitPush -LocalBranch $currentBranch)) {
            if ($stashed) { Invoke-GitStashPop }
            return $false
        }
    } else {
        Write-Info "No local commits to push`n"
    }
    
    # Restore stashed changes
    if ($stashed) {
        Write-Host ""
        Invoke-GitStashPop
    }
    
    # Final status
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Success "Bidirectional sync completed"
    Write-Host "========================================`n" -ForegroundColor Green
    
    return $true
}

# Continuous sync loop
function Start-ContinuousSync {
    Write-Info "Starting continuous sync (interval: $Interval seconds)"
    Write-Info "Press Ctrl+C to stop`n"
    
    while ($true) {
        $success = Invoke-BidirectionalSync
        
        if (-not $success) {
            Write-Warning "Sync failed - will retry in $Interval seconds"
        }
        
        Write-Host "Waiting $Interval seconds until next sync..." -ForegroundColor Gray
        Start-Sleep -Seconds $Interval
        Write-Host "`n"
    }
}

# Main execution
try {
    if ($Interval -gt 0) {
        Start-ContinuousSync
    } else {
        $success = Invoke-BidirectionalSync
        exit $(if ($success) { 0 } else { 1 })
    }
} catch {
    Write-Error "Unexpected error: $_"
    exit 1
}
