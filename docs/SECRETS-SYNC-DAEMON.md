# Secrets Sync Auto-Discovery & 24/7 Daemon

This system provides automatic repository discovery and continuous secrets synchronization for all InfinityXOneSystems repositories.

## Features

### 🔍 Auto-Discovery
- Automatically discovers all repositories in the InfinityXOneSystems GitHub organization
- Smart caching (1-hour TTL) to minimize API calls
- Handles pagination for organizations with many repositories
- Filters repositories based on configuration (archived, private, excluded)
- Falls back to hardcoded list if GitHub token unavailable

### 🔄 24/7 Daemon Mode
- Continuous operation with configurable sync intervals (default: 6 hours)
- Graceful startup and shutdown (SIGINT/SIGTERM handling)
- File-based locking to prevent concurrent executions
- State tracking and health monitoring
- Automatic detection of new repositories

### 🔐 Secrets Management
- Auto-generates `.gitignore` files for secret protection
- Creates `.env.local` templates with encryption keys
- Generates `secrets-manifest.json` for documentation
- Detects project types (Node.js, Python, Docker, etc.)
- Ensures secrets are properly protected

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm installed
- GitHub Personal Access Token with repo access
- Set `GITHUB_TOKEN` environment variable

```bash
export GITHUB_TOKEN=your_github_token_here
```

### Configuration

Edit `config/secrets-sync.config.json`:

```json
{
  "github": {
    "organization": "InfinityXOneSystems",
    "token_env_var": "GITHUB_TOKEN"
  },
  "sync": {
    "enabled": true,
    "interval_hours": 6,
    "auto_start": true
  },
  "repos": {
    "exclude": [],
    "include_archived": false,
    "include_private": true
  },
  "secrets": {
    "encryption_key_length": 32,
    "auto_rotate_keys": false
  }
}
```

## Usage

### Discover Repositories

List all repositories in the organization:

```bash
npm run secrets:discover
```

Example output:
```
🔍 DISCOVERY MODE - Listing all repositories

📋 DISCOVERED REPOSITORIES (35 total):
  1. foundation
  2. frontend
  3. backend
  ...
```

### Single Execution (Once Mode)

Run secrets setup once for all repositories:

```bash
npm run secrets:setup
```

This is the original behavior - runs once and exits.

### Start Daemon Mode

Start continuous 24/7 operation:

```bash
npm run secrets:daemon
```

The daemon will:
1. Discover all repositories
2. Run initial sync
3. Schedule periodic syncs every 6 hours (configurable)
4. Continue running until stopped with Ctrl+C

### Check Status

View current sync status:

```bash
npm run secrets:status
```

Example output:
```
📊 SYNC STATUS REPORT

Daemon Status: 🔴 STOPPED
Last Sync: 2025-12-14T01:52:22.072Z
Next Sync: 2025-12-14T07:52:22.075Z
Success Count: 15
Failure Count: 0

📁 Repository Status (15 repos):
✅ foundation: Synced successfully
✅ frontend: Synced successfully
...
```

## Architecture

### Components

#### 1. GitHub Repository Discovery (`src/services/github-repo-discovery.ts`)
- Uses GitHub REST API (Octokit) to fetch repositories
- Implements smart caching with TTL
- Monitors rate limits
- Handles pagination automatically

#### 2. Secrets Sync Daemon (`src/services/secrets-sync-daemon.ts`)
- Manages continuous operation
- File-based locking prevents concurrent runs
- State tracking in `~/.infinity-x-one/secrets-sync-state.json`
- Graceful signal handling

#### 3. Main Script (`scripts/setup-secrets-all-repos.ts`)
- Command-line interface
- Integrates discovery and daemon services
- Maintains backward compatibility

### State Files

All state files are stored in `~/.infinity-x-one/`:

- `repo-cache.json` - Cached repository list (1-hour TTL)
- `secrets-sync-state.json` - Sync history and status
- `secrets-sync.lock` - Lock file to prevent concurrent runs

These files are automatically managed and should not be edited manually.

## Command-Line Options

- `--once` (default): Run once and exit
- `--daemon`: Continuous 24/7 operation
- `--discover`: List all discovered repositories
- `--status`: Show current sync status

## Environment Variables

- `GITHUB_TOKEN` (required): GitHub Personal Access Token
- `REPOS_ROOT` (optional): Root directory for repositories
  - Default: `~/Documents/InfinityXOneSystems`

## What Gets Created

For each repository, the script creates:

### 1. `.gitignore`
Comprehensive secret protection including:
- Environment files (`.env`, `.env.local`, etc.)
- API keys and tokens
- Credentials and certificates
- Cloud provider keys
- OAuth tokens

### 2. `.env.local` Template
Pre-configured with:
- Encryption keys (auto-generated)
- Admin keys
- JWT secrets
- GitHub configuration
- Google Cloud placeholders
- API key placeholders

### 3. `secrets-manifest.json`
Documentation file containing:
- Secret descriptions
- Sync status
- Timestamp information
- Repository metadata

## Rate Limiting

The system respects GitHub API rate limits:
- Monitors remaining API calls
- Warns when approaching limit
- Implements delays between API calls
- Uses caching to minimize requests

## Error Handling

- Network errors: Retries with exponential backoff
- Rate limit errors: Waits until rate limit resets
- Repository access errors: Continues with other repos
- File system errors: Logs and continues

## Troubleshooting

### "Another instance is already running"
A lock file exists. Either:
1. Stop the running daemon
2. Remove stale lock: `rm ~/.infinity-x-one/secrets-sync.lock`

### "GitHub API rate limit exceeded"
Wait for rate limit to reset. Check status:
```bash
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/rate_limit
```

### No repositories discovered
Check:
1. `GITHUB_TOKEN` is set correctly
2. Token has `repo` scope
3. Token is not expired
4. Organization name is correct in config

### Repositories not found
The script expects repositories to be cloned in `REPOS_ROOT`.
Set the environment variable:
```bash
export REPOS_ROOT=/path/to/your/repos
```

## Security

- Never commit state files (already in `.gitignore`)
- Keep `GITHUB_TOKEN` secret
- State files contain no secrets
- Lock files use PID for validation
- All secrets remain in `.env.local` (gitignored)

## Monitoring & Integration

The daemon can be integrated with monitoring systems:

- Check status with `npm run secrets:status`
- Parse `~/.infinity-x-one/secrets-sync-state.json` for metrics
- Monitor lock file for daemon health
- Track success/failure counts over time

## Development

### Running Tests

```bash
npm test
```

### Testing Discovery

```bash
npm run secrets:discover
```

### Testing Daemon (with timeout)

```bash
timeout 30s npm run secrets:daemon
```

## Support

For issues or questions:
- Check GitHub Issues
- Review logs in daemon output
- Check state files in `~/.infinity-x-one/`

## License

Part of the InfinityXOneSystems foundation repository.
