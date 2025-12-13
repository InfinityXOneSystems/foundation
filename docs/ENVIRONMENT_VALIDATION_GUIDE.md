# Environment Validation Guide

## Overview

The InfinityXOneSystems Environment Validation System provides comprehensive validation of all environment variables across the entire ecosystem. It validates not just the presence and format of variables, but also tests actual connectivity and authentication with external services.

## Table of Contents

- [Quick Start](#quick-start)
- [Usage](#usage)
- [Validation Commands](#validation-commands)
- [Service Validators](#service-validators)
- [Adding New Validators](#adding-new-validators)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)
- [Security Best Practices](#security-best-practices)

## Quick Start

### 1. Copy Environment Template

```bash
cp .env.master.template .env
```

### 2. Fill in Your Values

Edit `.env` and add your credentials and configuration values.

### 3. Validate Your Environment

```bash
npm run env:validate
```

## Usage

### Basic Validation

Run a complete validation of all configured environment variables:

```bash
npm run env:validate
```

Example output:
```
🔍 Environment Validation Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ GitHub
   Variables tested: GITHUB_TOKEN
   Status: HEALTHY

✅ Anthropic
   Variables tested: ANTHROPIC_API_KEY
   Status: HEALTHY

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Summary: 10 variables tested
Valid: 10 | Failed: 0
Status: ✅ PASSED - All validations successful
```

### Quick Check (Skip Slow Tests)

Run a quick validation that skips database and cache connectivity tests:

```bash
npm run env:check
```

This is useful for rapid feedback during development.

### JSON Output

Get validation results in JSON format for programmatic processing:

```bash
npm run env:validate:json
```

Output format:
```json
{
  "timestamp": "2025-12-13T10:30:00Z",
  "overall_status": "passed",
  "summary": {
    "total_variables": 10,
    "required_missing": 0,
    "optional_missing": 0,
    "format_errors": 0,
    "service_failures": 0
  },
  "details": [...],
  "by_service": [...]
}
```

### Test Specific Service

Validate credentials for a specific service only:

```bash
npm run env:test-service github
npm run env:test-service anthropic
npm run env:test-service redis
```

Available services:
- `github` - GitHub API integration
- `anthropic` - Anthropic Claude API
- `gemini` - Google Gemini API
- `groq` - Groq API
- `redis` - Redis cache
- `postgresql` - PostgreSQL database
- `stripe` - Stripe payments
- `twilio` - Twilio communications
- `sendgrid` - SendGrid email
- `gcp` - Google Cloud Platform

### Generate Report File

Generate a validation report saved to `validation-report.json`:

```bash
npm run env:report
```

### Strict Mode (CI/CD)

Fail the validation if any warnings are present:

```bash
npm run env:validate:ci
```

This is useful in CI/CD pipelines where you want to enforce all validations pass.

## Validation Commands

| Command | Description | Use Case |
|---------|-------------|----------|
| `npm run env:validate` | Full validation with console output | Development, manual checks |
| `npm run env:validate:json` | Full validation with JSON output | Automation, parsing results |
| `npm run env:validate:ci` | Strict validation (fail on warnings) | CI/CD pipelines |
| `npm run env:check` | Quick validation (skip slow tests) | Rapid development feedback |
| `npm run env:test-service <name>` | Test specific service only | Debugging specific integrations |
| `npm run env:report` | Generate validation report file | Documentation, auditing |

## Service Validators

### GitHub (`GITHUB_TOKEN`)

**What it validates:**
- Token is valid and not expired
- Can authenticate with GitHub API
- Rate limit status
- Token scopes (if available)

**Required scopes:**
- `repo` - Repository access
- `workflow` - GitHub Actions workflow access

**Setup:**
1. Go to https://github.com/settings/tokens
2. Generate a new Personal Access Token
3. Select required scopes: `repo`, `workflow`, `admin:org` (if needed)
4. Set `GITHUB_TOKEN` in your `.env` file

**Troubleshooting:**
- **401 Unauthorized**: Token is invalid or expired
- **403 Forbidden**: Token lacks required scopes
- **Rate limit exceeded**: Wait or use a token with higher rate limits

### Anthropic (`ANTHROPIC_API_KEY`)

**What it validates:**
- API key is valid
- Can make requests to Claude API
- Model access permissions

**Setup:**
1. Go to https://console.anthropic.com/
2. Create an API key
3. Set `ANTHROPIC_API_KEY` in your `.env` file

**Troubleshooting:**
- **401 Unauthorized**: Invalid API key
- **429 Rate Limited**: Too many requests, wait or upgrade plan
- **500 Server Error**: Anthropic service issue, check https://status.anthropic.com/

### Google Gemini (`GOOGLE_AI_API_KEY`)

**What it validates:**
- API key is valid
- Can list available models
- API quota status

**Setup:**
1. Go to https://makersuite.google.com/app/apikey
2. Create an API key
3. Set `GOOGLE_AI_API_KEY` in your `.env` file

**Troubleshooting:**
- **400 Bad Request**: Invalid API key format
- **403 Forbidden**: API key doesn't have access to Gemini
- **429 Rate Limited**: Quota exceeded

### Groq (`GROQ_API_KEY`)

**What it validates:**
- API key is valid
- Can list available models
- API access status

**Setup:**
1. Go to https://console.groq.com/keys
2. Create an API key
3. Set `GROQ_API_KEY` in your `.env` file

**Troubleshooting:**
- **401 Unauthorized**: Invalid API key
- **429 Rate Limited**: Request limit exceeded

### Redis (`REDIS_URL`)

**What it validates:**
- Redis server is reachable
- Can connect to Redis
- Authentication works (if password provided)

**Setup:**
```bash
# Local Redis
REDIS_URL=redis://localhost:6379

# Remote Redis with password
REDIS_URL=redis://:password@redis.example.com:6379

# Redis with username and password
REDIS_URL=redis://username:password@redis.example.com:6379
```

**Troubleshooting:**
- **Connection refused**: Redis is not running or not accessible
- **Authentication failed**: Wrong password in URL
- **Timeout**: Network connectivity issue or firewall blocking

### PostgreSQL (`DATABASE_URL` or `PG_*`)

**What it validates:**
- PostgreSQL server is reachable
- Port is accessible
- Basic connectivity

**Note:** Full authentication requires pg client library (not included by default)

**Setup Option 1 - Connection URL:**
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

**Setup Option 2 - Individual Variables:**
```bash
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=mydb
PG_USER=myuser
PG_PASSWORD=mypassword
```

**Troubleshooting:**
- **Server not reachable**: PostgreSQL not running or wrong host/port
- **Authentication failed**: Wrong credentials
- **Database doesn't exist**: Create database first

### Stripe (`STRIPE_API_KEY`)

**What it validates:**
- API key format is correct (starts with `sk_test_` or `sk_live_`)
- Can authenticate with Stripe API
- Account information accessible
- Test vs production mode detection

**Setup:**
1. Go to https://dashboard.stripe.com/apikeys
2. Copy your API key (test or live)
3. Set `STRIPE_API_KEY` in your `.env` file

**⚠️ Warning:** The validator will warn you if using a production key.

**Troubleshooting:**
- **Invalid key format**: Key must start with `sk_test_` or `sk_live_`
- **401 Unauthorized**: Invalid API key
- **Network error**: Check https://status.stripe.com/

### Twilio (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`)

**What it validates:**
- Account SID format (starts with `AC`)
- Credentials are valid
- Can authenticate with Twilio API
- Account status

**Setup:**
1. Go to https://console.twilio.com/
2. Copy your Account SID and Auth Token
3. Set both variables in your `.env` file:
```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
```

**Troubleshooting:**
- **Invalid SID format**: Account SID must start with `AC`
- **401 Unauthorized**: Wrong credentials
- **Account suspended**: Check Twilio console

### SendGrid (`SENDGRID_API_KEY`)

**What it validates:**
- API key format (starts with `SG.`)
- Can authenticate with SendGrid API
- API key scopes and permissions

**Setup:**
1. Go to https://app.sendgrid.com/settings/api_keys
2. Create an API key with required scopes
3. Set `SENDGRID_API_KEY` in your `.env` file

**Required scopes:**
- `mail.send` - For sending emails

**Troubleshooting:**
- **Invalid key format**: Key must start with `SG.`
- **401/403**: Invalid API key or insufficient scopes
- **Network error**: Check https://status.sendgrid.com/

### Google Cloud Platform (`GOOGLE_GCP_AUTH_JSON`)

**What it validates:**
- Service account JSON is valid format
- Contains all required fields
- Service account type is correct
- Project ID matches (if `GOOGLE_CLOUD_PROJECT_ID` is set)

**Setup:**
1. Go to https://console.cloud.google.com/
2. Navigate to IAM & Admin > Service Accounts
3. Create or select a service account
4. Create a JSON key
5. Set the entire JSON content as `GOOGLE_GCP_AUTH_JSON`

**Required JSON fields:**
- `type` (must be "service_account")
- `project_id`
- `private_key`
- `client_email`

**Troubleshooting:**
- **Invalid JSON**: Ensure the entire JSON is properly formatted
- **Missing fields**: Download a fresh service account key
- **Project ID mismatch**: Update `GOOGLE_CLOUD_PROJECT_ID` to match

## Adding New Validators

### 1. Create Validator Class

Create a new file in `scripts/validators/`:

```typescript
// scripts/validators/my-service-validator.ts
import { ValidationResult, ServiceValidator, maskCredential, createValidationResult } from './types.js';

export class MyServiceValidator implements ServiceValidator {
  name = 'My Service';

  async validate(apiKey: string): Promise<ValidationResult> {
    if (!apiKey) {
      return createValidationResult(
        this.name,
        'MY_SERVICE_API_KEY',
        false,
        'API key is not set',
        'Set MY_SERVICE_API_KEY with a valid key from https://myservice.com'
      );
    }

    try {
      // Test the API
      const response = await fetch('https://api.myservice.com/v1/auth', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (response.ok) {
        return createValidationResult(
          this.name,
          'MY_SERVICE_API_KEY',
          true,
          'Valid API key',
          undefined,
          { key_preview: maskCredential(apiKey) }
        );
      } else {
        return createValidationResult(
          this.name,
          'MY_SERVICE_API_KEY',
          false,
          `API error: ${response.status}`,
          'Check your API key',
          { status: response.status }
        );
      }
    } catch (error: any) {
      return createValidationResult(
        this.name,
        'MY_SERVICE_API_KEY',
        false,
        `Validation failed: ${error.message}`,
        'Check network connectivity',
        { error: error.message }
      );
    }
  }
}
```

### 2. Register in Main Script

Add to `scripts/validate-environment.ts`:

```typescript
import { MyServiceValidator } from './validators/my-service-validator.js';

// In validateEnvironment():
const myServiceValidator = new MyServiceValidator();

if (process.env.MY_SERVICE_API_KEY) {
  console.log('Testing My Service...');
  const result = await myServiceValidator.validate(process.env.MY_SERVICE_API_KEY);
  results.push(result);
}
```

### 3. Update Environment Template

Add the new variable to `.env.master.template`:

```bash
MY_SERVICE_API_KEY=
# Description: API key for My Service
# Required: yes (for My Service integration)
# Validation: Test with My Service API
# Example: ms_xxxxxxxxxxxxxxxxxxxx
```

### 4. Test Your Validator

```bash
export MY_SERVICE_API_KEY=your_test_key
npm run env:test-service myservice
```

## CI/CD Integration

### GitHub Actions

The repository includes a pre-configured GitHub Actions workflow (`.github/workflows/validate-env.yml`) that:

1. Runs on every PR and push to main
2. Validates environment configuration
3. Tests service connectivity (with available secrets)
4. Comments on PRs with validation results
5. Generates downloadable validation reports

**Required GitHub Secrets:**

Set these in your repository settings (Settings > Secrets and variables > Actions):

- `GITHUB_TOKEN` (auto-provided)
- `ANTHROPIC_API_KEY`
- `GROQ_API_KEY`
- `GOOGLE_AI_API_KEY`
- `REDIS_URL`
- `DATABASE_URL`
- `STRIPE_API_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `SENDGRID_API_KEY`
- `GOOGLE_GCP_AUTH_JSON`
- `GOOGLE_CLOUD_PROJECT_ID`

### Other CI Systems

For other CI systems (GitLab CI, Jenkins, etc.), use the CLI commands:

```bash
# Install dependencies
npm ci

# Run validation
npm run env:validate:ci

# Or with JSON output
npm run env:validate:json > validation-report.json
```

Exit codes:
- `0` - All validations passed
- `1` - One or more validations failed

## Troubleshooting

### Common Issues

#### "Command not found: ts-node"

**Solution:**
```bash
npm install
```

#### "Cannot find module 'octokit'"

**Solution:**
```bash
npm install
```

#### "ECONNREFUSED" errors

**Cause:** Service is not running or not accessible

**Solutions:**
1. Check if service is running locally (Redis, PostgreSQL)
2. Verify network connectivity for remote services
3. Check firewall rules
4. Verify URLs and ports in configuration

#### "Authentication failed" errors

**Solutions:**
1. Double-check credentials are correct
2. Ensure no extra whitespace in `.env` file
3. Verify credentials haven't expired
4. Check service account permissions (for GCP)
5. Confirm API keys are for the correct environment (test vs production)

#### "Rate limit exceeded" errors

**Solutions:**
1. Wait before retrying
2. Use API keys with higher rate limits
3. Use the `--quick` flag to skip some validations
4. Implement caching if running validations frequently

### Debugging

Enable detailed error output:

```bash
# Run with Node.js debug output
NODE_DEBUG=* npm run env:validate

# Check specific service
npm run env:test-service github
```

### Getting Help

1. Check service status pages:
   - GitHub: https://www.githubstatus.com/
   - Anthropic: https://status.anthropic.com/
   - Stripe: https://status.stripe.com/
   - Twilio: https://status.twilio.com/
   - SendGrid: https://status.sendgrid.com/

2. Review service documentation
3. Check the validation report for specific error messages
4. Open an issue in the repository

## Security Best Practices

### Credential Storage

1. **Never commit credentials to git**
   - Use `.env` files (already in `.gitignore`)
   - Use secret management systems (Vault, AWS Secrets Manager)
   - Use environment variables in production

2. **Use minimal permissions**
   - Create service accounts with only required permissions
   - Use read-only credentials where possible
   - Rotate credentials regularly

3. **Separate environments**
   - Use different credentials for dev/staging/production
   - Never use production credentials in development
   - Use test mode API keys when available (Stripe, Twilio)

### Validation Security

1. **Credentials are never logged**
   - The validator only shows first 8 characters of credentials
   - Full credentials never appear in console output
   - JSON reports mask sensitive data

2. **CI/CD considerations**
   - Use GitHub Secrets or equivalent for CI
   - Never echo secrets in CI logs
   - Be cautious with verbose logging modes

3. **Rate limiting**
   - Validators include built-in delays to prevent API abuse
   - Don't run validation in tight loops
   - Use `--quick` mode for frequent checks

### Audit Trail

1. Generate validation reports regularly:
```bash
npm run env:report
```

2. Store reports securely for compliance:
   - Reports include timestamps
   - Service health status
   - Issues found (without exposing credentials)

3. Review reports periodically for:
   - Expired credentials
   - Services with degraded status
   - Missing configurations

## Best Practices

### Development

1. **Start with the template**
   ```bash
   cp .env.master.template .env
   ```

2. **Validate early and often**
   ```bash
   npm run env:check
   ```

3. **Test specific services when debugging**
   ```bash
   npm run env:test-service github
   ```

### Production

1. **Use secret management**
   - Vault, AWS Secrets Manager, GCP Secret Manager
   - Never commit production credentials

2. **Validate before deployment**
   ```bash
   npm run env:validate:ci
   ```

3. **Monitor continuously**
   - Set up scheduled validation runs
   - Alert on validation failures
   - Track credential expiration

### Team Collaboration

1. **Document custom variables**
   - Add to `.env.master.template`
   - Include description, validation, and example

2. **Share validation reports**
   - Include in PRs
   - Review as part of deployment checklist

3. **Keep validators updated**
   - Add validators for new services
   - Update when APIs change
   - Test regularly

## Appendix

### Environment Variable Reference

See `.env.master.template` for the complete list of all environment variables used across the InfinityXOneSystems ecosystem.

### Validation Report Schema

```typescript
interface ValidationReport {
  timestamp: string;
  overall_status: 'passed' | 'warnings' | 'failed';
  summary: {
    total_variables: number;
    required_missing: number;
    optional_missing: number;
    format_errors: number;
    service_failures: number;
  };
  details: ValidationResult[];
  by_service: ServiceHealth[];
}
```

### Exit Codes

- `0` - Success, all validations passed
- `1` - Failure, one or more validations failed

### Version History

- **v1.0.0** (2025-12-13) - Initial release
  - GitHub, Anthropic, Gemini, Groq validators
  - Redis, PostgreSQL validators
  - Stripe, Twilio, SendGrid validators
  - GCP validator
  - GitHub Actions integration
  - Comprehensive documentation

---

For questions or issues, please open an issue in the repository or contact the InfinityXOneSystems team.
