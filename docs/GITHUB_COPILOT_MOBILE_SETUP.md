# GitHub Copilot Mobile Integration Setup Guide

## Overview

This guide enables secure mobile access to GitHub Copilot and synchronized secrets management between your local environment and GitHub repository.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Local Development Environment                                  │
│  ┌──────────────────────┐     ┌────────────────────────────┐   │
│  │ .env.local           │     │ encryption system          │   │
│  │ (encrypted secrets)  │────►│ AES-256-CBC + PBKDF2       │   │
│  │                      │     │ Mobile tokens              │   │
│  └──────────────────────┘     └────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
           ▲                              ▲
           │                              │
           │ (bidirectional sync)         │
           │                              │
        ┌──────────────────────────────────────────┐
        │ GitHub Secrets Sync Engine               │
        │ • Push to GitHub Actions Secrets         │
        │ • Pull from GitHub repository           │
        │ • Manifest checksums for integrity      │
        │ • Mobile metadata endpoints              │
        └──────────────────────────────────────────┘
           ▲
           │
           │ (HTTP REST API)
           │
     ┌─────────────────────────────────────────────────┐
     │ Express Mobile API Server (Port 3000)           │
     │ ┌──────────────────────────────────────────┐   │
     │ │ /auth/generate-token (Admin Key)         │   │
     │ │ /sync/secrets (Bearer Token)             │   │
     │ │ /sync/metadata (Bearer Token)            │   │
     │ │ /orchestration/status (Bearer Token)     │   │
     │ │ /orchestration/exec (Bearer Token)       │   │
     │ └──────────────────────────────────────────┘   │
     └─────────────────────────────────────────────────┘
           ▲
           │
           │ (HTTPS + Bearer Token)
           │
     ┌──────────────────────────────────────┐
     │ Mobile Client (iOS/Android/Web)      │
     │ • Stored bearer token in keychain    │
     │ • Trigger sync operations            │
     │ • View secrets metadata              │
     │ • Execute orchestration commands     │
     └──────────────────────────────────────┘
```

## Prerequisites

- Node.js 16+ with TypeScript support
- GitHub repository with `repo` and `admin:repo_hook` scopes
- Environment variables configured (.env.example → .env.local)
- `GITHUB_TOKEN` with appropriate permissions
- OpenAI/Anthropic API keys for agent functionality

## Step 1: Configure Local Encryption Keys

Edit or create `.env.local` in the project root:

```bash
# Encryption & Mobile Access Configuration
ENCRYPTION_KEY="your-super-secret-encryption-key-min-32-chars"
ADMIN_KEY="your-admin-key-for-token-generation"

# GitHub Configuration (copy from .env.example)
GITHUB_TOKEN="ghp_your_github_personal_access_token"

# API Keys
ANTHROPIC_API_KEY="sk-ant-..."
OPENAI_API_KEY="sk-..."
GROQ_API_KEY="gsk_..."

# Other Environment Variables (from .env.example)
PORT=3000
LOOP_CYCLE_INTERVAL=60000
```

**Security Notes:**
- Keep `ENCRYPTION_KEY` and `ADMIN_KEY` secure and never commit to repository
- Use `openssl rand -base64 32` to generate strong keys
- Store in `.env.local` which is git-ignored
- For production, use Azure Key Vault or AWS Secrets Manager

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Initialize Local Encryption

Generate your first mobile access token:

```bash
npm run sync:secrets:mobile my-device
```

Output:
```
✅ Mobile access token generated for my-device
Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkZXZpY2VOYW1lIjoibXktZGV2aWNlIiwiaWF0IjoxNjk0OTAwMDAwfQ...
Expires: 2024-10-25T12:00:00Z

To use this token with the mobile API:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Save this token securely** - you'll need it for mobile client configuration.

## Step 4: Start the Mobile API Server

```bash
npm run api:mobile
```

Server output:
```
✅ Copilot Mobile API running on http://localhost:3000
📱 Mobile integration ready
🔐 GitHub secrets sync enabled

Endpoints:
  GET  /health
  POST /auth/generate-token (requires X-Admin-Key)
  GET  /sync/metadata (requires Bearer token)
  POST /sync/secrets (requires Bearer token)
  GET  /orchestration/status (requires Bearer token)
  POST /orchestration/exec (requires Bearer token)
```

## Step 5: Validate Configuration

### Health Check (Public - No Auth)
```bash
curl http://localhost:3000/health
```

### Sync Metadata (Requires Token)
```bash
curl -H "Authorization: Bearer YOUR_MOBILE_TOKEN" \
  http://localhost:3000/sync/metadata
```

Response:
```json
{
  "repo": "InfinityXOneSystems/foundation",
  "lastSync": "2024-10-24T10:30:00Z",
  "secretCount": 12
}
```

### Trigger Secrets Sync
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_MOBILE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"direction": "both"}' \
  http://localhost:3000/sync/secrets
```

## Step 6: CLI Commands for Local Management

### Sync All Secrets (Bidirectional)
```bash
npm run sync:secrets
```

### Push Secrets to GitHub
```bash
npm run sync:secrets:push
```

### Pull Secrets from GitHub
```bash
npm run sync:secrets:pull
```

### Generate New Mobile Token
```bash
npm run sync:secrets:mobile device-name
```

### View Sync Status
```bash
ts-node scripts/sync-secrets-cli.ts status
```

## Step 7: Mobile Client Implementation

### Example: Web-Based Mobile Client (HTML/JavaScript)

Create `mobile-client/index.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>GitHub Copilot Mobile</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    .card { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; }
    button { padding: 10px 20px; background: #0066cc; color: white; border: none; border-radius: 5px; cursor: pointer; }
    button:hover { background: #0052a3; }
    .status { margin-top: 10px; padding: 10px; background: #f5f5f5; border-radius: 3px; }
  </style>
</head>
<body>
  <h1>🔐 GitHub Copilot Mobile Dashboard</h1>
  
  <div class="card">
    <h2>Connection Status</h2>
    <div id="status" class="status">Initializing...</div>
    <button onclick="checkHealth()">Check Health</button>
  </div>

  <div class="card">
    <h2>Secrets Management</h2>
    <div id="metadata" class="status">Loading...</div>
    <button onclick="triggerSync('both')">Sync All (Push & Pull)</button>
    <button onclick="triggerSync('push')">Push to GitHub</button>
    <button onclick="triggerSync('pull')">Pull from GitHub</button>
  </div>

  <div class="card">
    <h2>Orchestration</h2>
    <button onclick="executeCommand('sync-secrets')">Execute: Sync Secrets</button>
    <button onclick="executeCommand('get-status')">Execute: Get Status</button>
    <button onclick="getOrchestrationStatus()">Get Capabilities</button>
  </div>

  <script>
    const API_BASE = 'http://localhost:3000';
    const TOKEN = localStorage.getItem('mobile_token') || 'YOUR_TOKEN_HERE';

    // Prompt for token on first load
    if (TOKEN === 'YOUR_TOKEN_HERE') {
      const newToken = prompt('Enter your mobile access token:');
      if (newToken) localStorage.setItem('mobile_token', newToken);
    }

    async function request(method, endpoint, body = null) {
      const options = {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('mobile_token')}`,
          'Content-Type': 'application/json'
        }
      };
      if (body) options.body = JSON.stringify(body);
      
      const response = await fetch(`${API_BASE}${endpoint}`, options);
      return response.json();
    }

    async function checkHealth() {
      const result = await fetch(`${API_BASE}/health`).then(r => r.json());
      document.getElementById('status').textContent = JSON.stringify(result, null, 2);
    }

    async function getMetadata() {
      const result = await request('GET', '/sync/metadata');
      const html = `
        <strong>Repository:</strong> ${result.repo}<br>
        <strong>Last Sync:</strong> ${result.lastSync}<br>
        <strong>Total Secrets:</strong> ${result.secretCount}
      `;
      document.getElementById('metadata').innerHTML = html;
    }

    async function triggerSync(direction) {
      const result = await request('POST', '/sync/secrets', { direction });
      document.getElementById('status').textContent = JSON.stringify(result, null, 2);
      getMetadata();
    }

    async function getOrchestrationStatus() {
      const result = await request('GET', '/orchestration/status');
      document.getElementById('status').textContent = JSON.stringify(result, null, 2);
    }

    async function executeCommand(command) {
      const result = await request('POST', '/orchestration/exec', { command });
      document.getElementById('status').textContent = JSON.stringify(result, null, 2);
    }

    // Load on startup
    checkHealth();
    getMetadata();
  </script>
</body>
</html>
```

## Step 8: Deploy to Production

### Using Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
```

### Using Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY src ./src
COPY .env.local ./
EXPOSE 3000
CMD ["npm", "run", "api:mobile"]
```

Build and push:
```bash
docker build -t copilot-mobile-api .
docker run -p 3000:3000 copilot-mobile-api
```

## Step 9: Security Checklist

- [ ] `ENCRYPTION_KEY` and `ADMIN_KEY` set in `.env.local` (not committed)
- [ ] `GITHUB_TOKEN` has minimal required scopes
- [ ] Mobile tokens stored securely in device keychain
- [ ] API server runs over HTTPS in production
- [ ] Rate limiting enabled on API endpoints
- [ ] Audit logging configured for all secret operations
- [ ] Regular token rotation schedule established
- [ ] Backup encryption keys stored safely

## Troubleshooting

### Token Validation Fails
```bash
# Regenerate token
npm run sync:secrets:mobile new-device

# Verify token in stored JSON
cat mobile-access-tokens.json
```

### GitHub Push Fails
```bash
# Verify GitHub token permissions
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user/repos

# Check GitHub org/repo name in code
# Should match GITHUB_OWNER and GITHUB_REPO environment variables
```

### Encryption Key Issues
```bash
# Verify encryption key is set
echo $ENCRYPTION_KEY

# Regenerate if corrupted
openssl rand -base64 32
```

### Port Already in Use
```bash
# Use different port
PORT=3001 npm run api:mobile

# Or kill process on port 3000
npx kill-port 3000
```

## Next Steps

1. **Mobile App Development**: Build native iOS/Android app using the API
2. **CI/CD Integration**: Add GitHub Actions workflow for auto-sync
3. **Monitoring**: Set up alerts for failed sync operations
4. **Backup**: Implement encrypted backup of secrets locally
5. **Audit**: Review access logs regularly for security monitoring

## API Reference

### POST /auth/generate-token
Generate new mobile access token (Admin Key required)
```bash
curl -X POST \
  -H "X-Admin-Key: your-admin-key" \
  -H "Content-Type: application/json" \
  -d '{"deviceName": "my-phone", "expiryDays": 30}' \
  http://localhost:3000/auth/generate-token
```

### POST /sync/secrets
Trigger secrets synchronization (Bearer Token required)
```bash
curl -X POST \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{"direction": "both"}' \
  http://localhost:3000/sync/secrets
```

### GET /sync/metadata
Retrieve sync metadata (Bearer Token required)
```bash
curl -H "Authorization: Bearer token" \
  http://localhost:3000/sync/metadata
```

### POST /orchestration/exec
Execute orchestration command (Bearer Token required)
```bash
curl -X POST \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{"command": "sync-secrets"}' \
  http://localhost:3000/orchestration/exec
```

### GET /orchestration/status
Get orchestration capabilities (Bearer Token required)
```bash
curl -H "Authorization: Bearer token" \
  http://localhost:3000/orchestration/status
```

## Support

For issues or questions:
1. Check logs: `tail -f logs/error.log`
2. Run tests: `npm test`
3. Validate types: `npm run typecheck`
4. Check linting: `npm run lint`

---

**Last Updated:** 2024-10-24
**Version:** 1.0.0
