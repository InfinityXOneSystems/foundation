# Git Bidirectional Sync

Comprehensive Git synchronization tools for maintaining perfect sync between local and remote repositories.

## 🎯 Features

- **Bidirectional Sync**: Automatic fetch, pull, and push operations
- **Conflict Detection**: Smart conflict detection and resolution strategies
- **Stash Management**: Automatic stashing of uncommitted changes
- **Multiple Strategies**: Support for merge, rebase, and fast-forward-only
- **Continuous Sync**: Optional interval-based continuous synchronization
- **Dry Run Mode**: Preview changes without applying them
- **Auto-Commit**: Automatically commit uncommitted changes before sync
- **Force Push**: Optional force push with safety (--force-with-lease)
- **Comprehensive Logging**: Detailed colored output for all operations
- **Retry Logic**: Automatic retry with configurable delays
- **Metrics Tracking**: Track sync performance and success rates

## 📦 Available Implementations

### 1. PowerShell Script
**File**: `scripts/git-bidirectional-sync.ps1`

```powershell
# Basic usage
.\scripts\git-bidirectional-sync.ps1

# With options
.\scripts\git-bidirectional-sync.ps1 -Remote origin -Branch main -Strategy rebase

# Dry run
.\scripts\git-bidirectional-sync.ps1 -DryRun

# Continuous sync every 5 minutes
.\scripts\git-bidirectional-sync.ps1 -Interval 300 -AutoCommit

# Force push (use with caution!)
.\scripts\git-bidirectional-sync.ps1 -Force
```

**Parameters**:
- `-Remote`: Remote name (default: origin)
- `-Branch`: Branch to sync (default: current branch)
- `-Strategy`: merge | rebase | fast-forward-only (default: merge)
- `-DryRun`: Preview changes without applying
- `-AutoCommit`: Auto-commit uncommitted changes
- `-Force`: Force push with --force-with-lease
- `-Interval`: Continuous sync interval in seconds (0 = one-time)

### 2. Bash Script
**File**: `scripts/git-bidirectional-sync.sh`

```bash
# Make executable
chmod +x scripts/git-bidirectional-sync.sh

# Basic usage
./scripts/git-bidirectional-sync.sh

# With options
./scripts/git-bidirectional-sync.sh --remote origin --branch main --strategy rebase

# Dry run
./scripts/git-bidirectional-sync.sh --dry-run

# Continuous sync every 5 minutes
./scripts/git-bidirectional-sync.sh --interval 300 --auto-commit

# Force push
./scripts/git-bidirectional-sync.sh --force
```

**Options**:
- `-r, --remote`: Remote name (default: origin)
- `-b, --branch`: Branch to sync (default: current branch)
- `-s, --strategy`: merge | rebase | fast-forward-only (default: merge)
- `-d, --dry-run`: Preview changes without applying
- `-a, --auto-commit`: Auto-commit uncommitted changes
- `-f, --force`: Force push with --force-with-lease
- `-i, --interval`: Continuous sync interval in seconds (0 = one-time)
- `-h, --help`: Show help message

### 3. TypeScript Service
**File**: `sync/git-sync-service.ts`

```typescript
import { GitSyncService } from './sync/git-sync-service';

const syncService = new GitSyncService({
  repositoryPath: process.cwd(),
  remote: 'origin',
  branch: 'main',
  strategy: 'merge',
  autoCommit: false,
  forcePush: false,
  interval: 300000, // 5 minutes
  dryRun: false,
  onConflict: 'stash',
  maxRetries: 3,
  retryDelay: 5000,
});

// Event listeners
syncService.on('sync-started', () => {
  console.log('Sync started...');
});

syncService.on('sync-completed', (result) => {
  console.log('Sync completed:', result);
});

syncService.on('sync-failed', (result) => {
  console.error('Sync failed:', result.error);
});

syncService.on('conflicts', ({ branch, conflicts }) => {
  console.warn('Conflicts:', { branch, conflicts });
});

// Start sync
await syncService.start();

// Get metrics
const metrics = syncService.getMetrics();
console.log('Metrics:', metrics);

// Stop sync (for continuous mode)
syncService.stop();
```

**Configuration**:
```typescript
interface SyncConfig {
  repositoryPath: string;       // Path to Git repository
  remote: string;                // Remote name (e.g., 'origin')
  branch?: string;               // Branch to sync (default: current)
  strategy: 'merge' | 'rebase' | 'fast-forward-only';
  autoCommit: boolean;           // Auto-commit uncommitted changes
  forcePush: boolean;            // Use --force-with-lease
  interval?: number;             // Continuous sync interval (ms)
  dryRun?: boolean;              // Preview mode
  onConflict?: 'abort' | 'stash' | 'auto-resolve';
  maxRetries?: number;           // Max retry attempts (default: 3)
  retryDelay?: number;           // Delay between retries (ms)
}
```

**Events**:
- `started`: Service started
- `stopped`: Service stopped
- `sync-started`: Sync operation started
- `sync-completed`: Sync completed successfully
- `sync-failed`: Sync failed
- `conflicts`: Merge conflicts detected
- `retrying`: Retrying after failure
- `stashed`: Changes stashed
- `stash-popped`: Stash restored
- `auto-committed`: Changes auto-committed
- `fetched`: Fetched from remote
- `pulled`: Pulled changes
- `pushed`: Pushed changes
- `dry-run`: Dry run operation

**Metrics**:
```typescript
interface SyncMetrics {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  conflictsResolved: number;
  averageDuration: number;
  lastSyncTime?: Date;
  lastError?: string;
}
```

## 🔄 Sync Workflow

```
1. Check Git repository validity
2. Detect current branch
3. Check for uncommitted changes
   ├─► Auto-commit (if enabled)
   ├─► Stash (if onConflict: 'stash')
   └─► Abort (if onConflict: 'abort')
4. Fetch from remote
5. Calculate commits ahead/behind
6. Pull changes (if behind)
   ├─► Merge strategy
   ├─► Rebase strategy
   └─► Fast-forward-only strategy
7. Detect conflicts
   └─► Notify and handle per strategy
8. Push changes (if ahead)
9. Restore stashed changes (if any)
10. Report results
```

## 🛡️ Conflict Resolution Strategies

### 1. **Stash** (Recommended)
```powershell
# PowerShell
.\scripts\git-bidirectional-sync.ps1 -AutoCommit:$false

# Bash
./scripts/git-bidirectional-sync.sh

# TypeScript
{ onConflict: 'stash' }
```
- Stashes uncommitted changes before sync
- Attempts to restore after sync completes
- Safe for most scenarios

### 2. **Auto-Commit**
```powershell
# PowerShell
.\scripts\git-bidirectional-sync.ps1 -AutoCommit

# Bash
./scripts/git-bidirectional-sync.sh --auto-commit

# TypeScript
{ autoCommit: true }
```
- Commits uncommitted changes with timestamp
- Useful for continuous sync workflows
- Creates commit history automatically

### 3. **Abort**
```typescript
// TypeScript only
{ onConflict: 'abort' }
```
- Aborts sync if uncommitted changes detected
- Requires manual intervention
- Safest option for critical work

## 📊 Usage Examples

### Example 1: Basic One-Time Sync
```powershell
# PowerShell
.\scripts\git-bidirectional-sync.ps1
```

### Example 2: Continuous Sync with Auto-Commit
```powershell
# PowerShell - sync every 5 minutes
.\scripts\git-bidirectional-sync.ps1 -Interval 300 -AutoCommit
```

### Example 3: Rebase Strategy with Dry Run
```bash
# Bash
./scripts/git-bidirectional-sync.sh --strategy rebase --dry-run
```

### Example 4: TypeScript with Full Monitoring
```typescript
import { GitSyncService } from './sync/git-sync-service';

const service = new GitSyncService({
  repositoryPath: '/path/to/repo',
  remote: 'origin',
  strategy: 'merge',
  autoCommit: true,
  forcePush: false,
  interval: 300000, // 5 minutes
  maxRetries: 3,
});

// Comprehensive event logging
service.on('sync-started', () => console.log('[START] Sync initiated'));
service.on('fetched', () => console.log('[FETCH] Downloaded remote changes'));
service.on('pulled', (data) => console.log('[PULL] Applied changes:', data));
service.on('pushed', (data) => console.log('[PUSH] Uploaded changes:', data));
service.on('sync-completed', (result) => {
  console.log('[SUCCESS] Sync completed:', {
    duration: result.duration,
    ahead: result.commitsAhead,
    behind: result.commitsBehind,
  });
});
service.on('conflicts', ({ conflicts }) => {
  console.error('[CONFLICT] Manual resolution required:', conflicts);
});

await service.start();
```

### Example 5: GitHub Actions Integration
```yaml
name: Bidirectional Sync

on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Configure Git
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
      
      - name: Run Bidirectional Sync
        run: |
          chmod +x scripts/git-bidirectional-sync.sh
          ./scripts/git-bidirectional-sync.sh --auto-commit
```

## 🔐 Security Considerations

1. **Force Push**: Use `--force-with-lease` instead of `--force` to prevent overwriting others' work
2. **Auto-Commit**: Creates commit history automatically - review before pushing to shared branches
3. **Credentials**: Ensure Git credentials are configured (SSH keys or credential manager)
4. **Branch Protection**: Respect branch protection rules on remote
5. **Sensitive Data**: Ensure `.gitignore` is properly configured before auto-commit

## 🐛 Troubleshooting

### Sync Failed: "Not a Git repository"
```bash
# Initialize Git repository
git init
git remote add origin <remote-url>
```

### Sync Failed: "Permission denied"
```bash
# Configure SSH keys
ssh-keygen -t ed25519 -C "your_email@example.com"
ssh-add ~/.ssh/id_ed25519

# Or use HTTPS with credential manager
git config --global credential.helper store
```

### Sync Failed: "Conflicts detected"
```bash
# Manual conflict resolution
git status
# Edit conflicted files
git add .
git commit -m "Resolved conflicts"
# Re-run sync
```

### Continuous Sync Not Running
```powershell
# PowerShell - run in background
Start-Job -ScriptBlock {
  & "C:\path\to\git-bidirectional-sync.ps1" -Interval 300
}
```

## 📈 Performance Optimization

1. **Shallow Clone**: Use shallow clones for faster fetch operations
   ```bash
   git config fetch.depth 1
   ```

2. **Partial Clone**: Clone only needed files
   ```bash
   git config core.sparseCheckout true
   ```

3. **Compression**: Enable Git compression
   ```bash
   git config core.compression 9
   ```

4. **Parallel Fetch**: Enable parallel fetching
   ```bash
   git config fetch.parallel 4
   ```

## 🔗 Integration with Other Tools

### Quantum Mind System
```typescript
import { GitSyncService } from './sync/git-sync-service';
import { UnifiedBrain } from './quantum-mind/unified-brain';

const brain = new UnifiedBrain();
const syncService = new GitSyncService({
  repositoryPath: process.cwd(),
  remote: 'origin',
  strategy: 'merge',
  autoCommit: true,
  interval: 300000,
});

syncService.on('sync-completed', async (result) => {
  // Notify Quantum Mind of successful sync
  await brain.processEvent({
    type: 'git.sync.completed',
    metadata: {
      branch: result.branch,
      commitsAhead: result.commitsAhead,
      commitsBehind: result.commitsBehind,
      duration: result.duration,
    },
  });
});

await Promise.all([
  brain.start(),
  syncService.start(),
]);
```

## 📚 Additional Resources

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Best Practices](https://docs.github.com/en/get-started/quickstart/github-flow)
- [Merge vs Rebase](https://www.atlassian.com/git/tutorials/merging-vs-rebasing)
- [Stash Documentation](https://git-scm.com/docs/git-stash)

## 🤝 Contributing

Contributions welcome! Please ensure:
1. All scripts are tested on Windows, macOS, and Linux
2. TypeScript code follows existing patterns
3. Documentation is updated for new features
4. Error handling is comprehensive

## 📄 License

MIT License - See [LICENSE](../LICENSE) for details
