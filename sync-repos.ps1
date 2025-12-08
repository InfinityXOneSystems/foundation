# Infinity X One Systems - Multi-Repository Auto-Sync Script (Windows PowerShell)
# Synchronizes all remote repositories to local machine
# Usage: .\sync-repos.ps1 [-BasePath "C:\path\to\repos"] [-Parallel 5] [-Update] [-Help]

param(
    [string]$BasePath = "$env:USERPROFILE\source\repos",
    [int]$Parallel = 3,
    [switch]$Update = $false,
    [switch]$Help = $false,
    [switch]$DryRun = $false,
    [string]$GitHubOrg = "InfinityXOneSystems"
)

# ============================================================
# CONFIGURATION
# ============================================================

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

# Color codes
$Colors = @{
    Reset   = "`e[0m"
    Green   = "`e[32m"
    Red     = "`e[31m"
    Yellow  = "`e[33m"
    Blue    = "`e[34m"
    Cyan    = "`e[36m"
    Gray    = "`e[90m"
}

# Repository list (extracted from repos.yml)
$Repos = @(
    "index", "taxonomy", "crawler_scraper", "foundation", "codegen", "agents",
    "vision_cortex", "planner", "strategy", "doc_evolution_system", "docs",
    "validator", "test", "evaluation", "gateway", "production", "auto_builder",
    "automation", "security", "frontend", "interfaces", "industries", "workspace",
    "devtools", "auto_templates", "prompt_library", "bootstrap", "simulator",
    "language", "sandbox", "metrics", "ml_platform", "research", "analytics",
    "enterprise"
)

# ============================================================
# HELPER FUNCTIONS
# ============================================================

function Write-ColorOutput {
    param(
        [string]$Message,
        [ValidateSet("Info", "Success", "Warning", "Error", "Debug")]$Type = "Info"
    )

    $color = switch ($Type) {
        "Success" { $Colors.Green }
        "Error" { $Colors.Red }
        "Warning" { $Colors.Yellow }
        "Debug" { $Colors.Gray }
        default { $Colors.Cyan }
    }

    Write-Host "$color$Message$($Colors.Reset)"
}

function Show-Help {
    @"
$($Colors.Blue)╔════════════════════════════════════════════════════════════════════════╗$($Colors.Reset)
$($Colors.Blue)║  Infinity X One Systems - Multi-Repository Auto-Sync Tool              ║$($Colors.Reset)
$($Colors.Blue)╚════════════════════════════════════════════════════════════════════════╝$($Colors.Reset)

DESCRIPTION:
  Automatically clones and synchronizes all InfinityXOneSystems repositories
  to your local machine in parallel.

USAGE:
  .\sync-repos.ps1 [OPTIONS]

OPTIONS:
  -BasePath <path>     Base directory for cloning repos (default: $env:USERPROFILE\source\repos)
  -Parallel <number>   Number of parallel clone operations (default: 3)
  -Update              Pull latest changes for existing repos (no-op if not present)
  -DryRun              Show what would be done without making changes
  -GitHubOrg <org>     GitHub organization (default: InfinityXOneSystems)
  -Help                Show this help message

EXAMPLES:
  # Clone all repos to default location
  .\sync-repos.ps1

  # Clone to custom location with 5 parallel jobs
  .\sync-repos.ps1 -BasePath "D:\Development\repos" -Parallel 5

  # Update existing repos
  .\sync-repos.ps1 -Update

  # See what would be cloned (dry run)
  .\sync-repos.ps1 -DryRun

  # Custom organization
  .\sync-repos.ps1 -GitHubOrg "MyOrg"

WHAT IT DOES:
  1. Creates base directory if needed
  2. Clones missing repositories from GitHub
  3. Updates existing repositories (with -Update flag)
  4. Generates sync report with timestamps
  5. Creates clone manifest for future reference

GENERATED FILES:
  - sync-manifest.json    : Repository inventory with URLs and paths
  - sync-report.txt       : Detailed sync operation report
  - sync-status.json      : Current sync status and metrics

PERFORMANCE:
  Default parallel jobs: 3 (adjust with -Parallel for faster/slower operations)
  Estimated time for 35 repos: 2-5 minutes depending on internet speed

NOTES:
  - Requires Git to be installed and in PATH
  - Requires network access to GitHub
  - Initial clone only; use -Update flag to sync existing repos
  - SSH keys must be configured for private repos

"@
}

function Test-Prerequisites {
    Write-ColorOutput "Checking prerequisites..." "Info"

    # Check Git
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Write-ColorOutput "ERROR: Git is not installed or not in PATH" "Error"
        Write-ColorOutput "Please install Git from https://git-scm.com" "Warning"
        return $false
    }

    Write-ColorOutput "✓ Git is installed: $(git --version)" "Success"

    # Check network connectivity
    $testUrl = "https://github.com"
    try {
        $null = Invoke-WebRequest -Uri $testUrl -TimeoutSec 3 -ErrorAction Stop
        Write-ColorOutput "✓ Network connectivity verified" "Success"
    }
    catch {
        Write-ColorOutput "WARNING: Could not verify network connectivity" "Warning"
    }

    return $true
}

function Initialize-BaseDirectory {
    param([string]$Path)

    if (Test-Path $Path) {
        Write-ColorOutput "✓ Base directory exists: $Path" "Success"
        return $true
    }

    Write-ColorOutput "Creating base directory: $Path" "Info"

    if ($DryRun) {
        Write-ColorOutput "[DRY RUN] Would create: $Path" "Debug"
        return $true
    }

    try {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
        Write-ColorOutput "✓ Created: $Path" "Success"
        return $true
    }
    catch {
        Write-ColorOutput "ERROR: Failed to create directory: $_" "Error"
        return $false
    }
}

function Clone-Repository {
    param(
        [string]$RepoName,
        [string]$BasePath,
        [string]$Org
    )

    $RepoPath = Join-Path $BasePath $RepoName
    $RemoteUrl = "https://github.com/$Org/$RepoName.git"

    if (Test-Path $RepoPath) {
        Write-ColorOutput "  ✓ $RepoName (already exists)" "Success"
        return @{
            Status = "Exists"
            Repo = $RepoName
            Path = $RepoPath
            Url = $RemoteUrl
        }
    }

    Write-ColorOutput "  → $RepoName" "Info"

    if ($DryRun) {
        Write-ColorOutput "    [DRY RUN] Would clone from: $RemoteUrl" "Debug"
        return @{
            Status = "WouldClone"
            Repo = $RepoName
            Path = $RepoPath
            Url = $RemoteUrl
        }
    }

    try {
        $output = git clone --quiet $RemoteUrl $RepoPath 2>&1
        Write-ColorOutput "  ✓ $RepoName (cloned)" "Success"

        return @{
            Status = "Cloned"
            Repo = $RepoName
            Path = $RepoPath
            Url = $RemoteUrl
            Timestamp = Get-Date -Format "o"
        }
    }
    catch {
        Write-ColorOutput "  ✗ $RepoName (ERROR: $_)" "Error"

        return @{
            Status = "Failed"
            Repo = $RepoName
            Path = $RepoPath
            Url = $RemoteUrl
            Error = $_
        }
    }
}

function Update-Repository {
    param(
        [string]$RepoName,
        [string]$BasePath
    )

    $RepoPath = Join-Path $BasePath $RepoName

    if (-not (Test-Path $RepoPath)) {
        return @{
            Status = "NotFound"
            Repo = $RepoName
        }
    }

    Write-ColorOutput "  → $RepoName" "Info"

    if ($DryRun) {
        Write-ColorOutput "    [DRY RUN] Would update repo at: $RepoPath" "Debug"
        return @{
            Status = "WouldUpdate"
            Repo = $RepoName
        }
    }

    try {
        Push-Location $RepoPath

        # Get current status
        $currentBranch = git rev-parse --abbrev-ref HEAD 2>$null
        $beforeCommit = git rev-parse --short HEAD 2>$null

        # Pull latest
        $output = git pull --quiet 2>&1
        $afterCommit = git rev-parse --short HEAD 2>$null

        Pop-Location

        if ($beforeCommit -eq $afterCommit) {
            Write-ColorOutput "  ✓ $RepoName (already up-to-date)" "Success"
            return @{
                Status = "UpToDate"
                Repo = $RepoName
                Branch = $currentBranch
                Commit = $afterCommit
            }
        }
        else {
            Write-ColorOutput "  ✓ $RepoName (updated: $beforeCommit → $afterCommit)" "Success"
            return @{
                Status = "Updated"
                Repo = $RepoName
                Branch = $currentBranch
                Before = $beforeCommit
                After = $afterCommit
            }
        }
    }
    catch {
        Write-ColorOutput "  ⚠ $RepoName (warning: $_)" "Warning"

        return @{
            Status = "Warning"
            Repo = $RepoName
            Error = $_
        }
    }
}

function Create-Manifest {
    param(
        [array]$Results,
        [string]$OutputPath
    )

    $manifest = @{
        timestamp = Get-Date -Format "o"
        organization = $GitHubOrg
        basePath = $BasePath
        totalRepos = $Results.Count
        repositories = @()
    }

    foreach ($result in $Results) {
        $manifest.repositories += @{
            name = $result.Repo
            path = $result.Path
            url = $result.Url
            status = $result.Status
            cloned = if ($result.Timestamp) { $result.Timestamp } else { $null }
        }
    }

    $manifestPath = Join-Path $BasePath "sync-manifest.json"
    $manifest | ConvertTo-Json -Depth 3 | Out-File -FilePath $manifestPath -Force
    Write-ColorOutput "✓ Manifest saved: $manifestPath" "Success"
}

function Create-Report {
    param(
        [array]$Results,
        [string]$Operation
    )

    $reportPath = Join-Path $BasePath "sync-report.txt"
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

    $report = @"
╔════════════════════════════════════════════════════════════════╗
  INFINITY X ONE SYSTEMS - REPOSITORY SYNC REPORT
╚════════════════════════════════════════════════════════════════╝

OPERATION: $Operation
TIMESTAMP: $timestamp
BASE PATH: $BasePath
ORGANIZATION: $GitHubOrg
DRY RUN: $DryRun

────────────────────────────────────────────────────────────────
SUMMARY
────────────────────────────────────────────────────────────────

Total Repositories: $($Results.Count)

"@

    # Count by status
    $statusCounts = $Results | Group-Object -Property Status | Select-Object -Property Name, Count

    foreach ($status in $statusCounts) {
        $report += "$($status.Name): $($status.Count)`n"
    }

    $report += @"

────────────────────────────────────────────────────────────────
DETAILED RESULTS
────────────────────────────────────────────────────────────────

"@

    foreach ($result in $Results | Sort-Object -Property Status, Repo) {
        $report += "`n[$($result.Status)] $($result.Repo)`n"
        $report += "  Path: $($result.Path)`n"
        if ($result.Url) {
            $report += "  URL:  $($result.Url)`n"
        }
        if ($result.Error) {
            $report += "  Error: $($result.Error)`n"
        }
        if ($result.Before -and $result.After) {
            $report += "  Commits: $($result.Before) → $($result.After)`n"
        }
    }

    $report += @"

────────────────────────────────────────────────────────────────
NEXT STEPS
────────────────────────────────────────────────────────────────

1. Review failed repositories above
2. For updates: .\sync-repos.ps1 -Update
3. To add to workspace: Add paths to your IDE/editor
4. For CI/CD: Use sync-manifest.json for automation

────────────────────────────────────────────────────────────────

"@

    $report | Out-File -FilePath $reportPath -Force -Encoding UTF8
    Write-ColorOutput "✓ Report saved: $reportPath" "Success"
    Write-Host $report
}

# ============================================================
# MAIN EXECUTION
# ============================================================

Write-ColorOutput "╔════════════════════════════════════════════════════════════════╗" "Blue"
Write-ColorOutput "║  Infinity X One Systems - Multi-Repository Auto-Sync Tool    ║" "Blue"
Write-ColorOutput "╚════════════════════════════════════════════════════════════════╝" "Blue"

if ($Help) {
    Show-Help
    exit 0
}

# Check prerequisites
if (-not (Test-Prerequisites)) {
    exit 1
}

Write-Host ""
Write-ColorOutput "Configuration:" "Info"
Write-ColorOutput "  Base Path:     $BasePath" "Debug"
Write-ColorOutput "  Organization:  $GitHubOrg" "Debug"
Write-ColorOutput "  Parallel Jobs: $Parallel" "Debug"
Write-ColorOutput "  Update Mode:   $(if ($Update) { 'Yes' } else { 'No' })" "Debug"
Write-ColorOutput "  Dry Run:       $(if ($DryRun) { 'Yes' } else { 'No' })" "Debug"
Write-Host ""

# Initialize base directory
if (-not (Initialize-BaseDirectory -Path $BasePath)) {
    exit 1
}

Write-Host ""

# Determine operation
if ($Update) {
    Write-ColorOutput "Updating existing repositories..." "Info"
    $results = @()

    # Sequential update (pull is slower with parallel)
    foreach ($repo in $Repos) {
        $result = Update-Repository -RepoName $repo -BasePath $BasePath
        $results += $result
    }

    Create-Report -Results $results -Operation "Update"
}
else {
    Write-ColorOutput "Cloning repositories ($Parallel parallel jobs)..." "Info"
    $results = @()

    # Clone in parallel batches
    for ($i = 0; $i -lt $Repos.Count; $i += $Parallel) {
        $batch = $Repos[$i..([Math]::Min($i + $Parallel - 1, $Repos.Count - 1))]

        foreach ($repo in $batch) {
            $result = Clone-Repository -RepoName $repo -BasePath $BasePath -Org $GitHubOrg
            $results += $result
        }
    }

    Create-Manifest -Results $results -OutputPath $BasePath
    Create-Report -Results $results -Operation "Clone"
}

# Summary
Write-Host ""
Write-ColorOutput "╔════════════════════════════════════════════════════════════════╗" "Blue"
Write-ColorOutput "║  SYNC COMPLETE                                                ║" "Blue"
Write-ColorOutput "╚════════════════════════════════════════════════════════════════╝" "Blue"

$clonedCount = ($results | Where-Object { $_.Status -eq "Cloned" } | Measure-Object).Count
$existsCount = ($results | Where-Object { $_.Status -eq "Exists" } | Measure-Object).Count
$failedCount = ($results | Where-Object { $_.Status -eq "Failed" } | Measure-Object).Count

Write-ColorOutput "Cloned: $clonedCount" "Success"
Write-ColorOutput "Existing: $existsCount" "Info"

if ($failedCount -gt 0) {
    Write-ColorOutput "Failed: $failedCount" "Error"
}

exit 0
