# Repository Settings for Infinity Prime

## Required Repository Configuration

This document describes the GitHub repository settings required for Infinity Prime to function correctly.

## General Settings

### Repository Name
`foundation`

### Description
Foundation repository for InfinityXOneSystems autonomous systems

### Visibility
Private (recommended) or Public

## Branch Protection Rules

### Main Branch (`main`)
Configure at: Settings → Branches → Branch protection rules

**Required settings:**
- ✅ Require a pull request before merging
- ✅ Require approvals: 0 (for Tier 1/2 auto-merge)
- ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ Require status checks to pass before merging
  - Required status checks:
    - `CI / validate`
    - `Integration Tests / integration`
    - `Smoke Tests / smoke`
    - `PR Enforcer / enforce`
- ✅ Require branches to be up to date before merging
- ✅ Require conversation resolution before merging
- ⚠️ Do NOT require pull request reviews for Tier 1/2 auto-merge
- ✅ Allow auto-merge

**Optional but recommended:**
- ✅ Require linear history
- ✅ Include administrators (enforce rules for everyone)
- ✅ Restrict who can push to matching branches (CI/CD only)

## Actions Settings

### General
Configure at: Settings → Actions → General

- **Actions permissions:** Allow all actions and reusable workflows
- **Workflow permissions:** Read and write permissions
- **Allow GitHub Actions to create and approve pull requests:** ✅ Enabled

## Secrets and Variables

### Repository Secrets
Configure at: Settings → Secrets and variables → Actions

**Required secrets:**
- `GITHUB_TOKEN` (auto-provided by GitHub Actions)
- `INFINITY_PRIME_APPROVER_TOKEN` - Personal access token with permissions:
  - `repo` (full control)
  - `workflow` (update workflows)
  - `admin:org` (read org data for auto-discovery)
  
**Optional secrets:**
- `SNYK_TOKEN` - For security scanning
- `DEPLOY_TOKEN` - For deployment workflows

### Repository Variables
None required currently

## Auto-Merge Settings

### Enable Auto-Merge
1. Go to Settings → General
2. Scroll to "Pull Requests"
3. Check "Allow auto-merge"
4. Check "Automatically delete head branches"

### Merge Method
- **Preferred:** Squash and merge
- Creates clean history
- Preserves PR context

## Issue Settings

### Templates
Location: `.github/ISSUE_TEMPLATE/`

Required templates (auto-created):
- `infinity-prime-regression.md`
- `blocked-approval-required.md`
- `blocked-permissions.md`

### Labels
Create these labels for Infinity Prime:

| Label | Color | Description |
|-------|-------|-------------|
| `tier-1` | `#0e8a16` | Risk Tier 1 - Auto-merge safe |
| `tier-2` | `#fbca04` | Risk Tier 2 - Auto-merge with checks |
| `tier-3` | `#ff9800` | Risk Tier 3 - Manual review required |
| `tier-4` | `#d73a4a` | Risk Tier 4 - Senior approval required |
| `blocked` | `#d73a4a` | PR blocked from auto-merge |
| `requires-approval` | `#ff9800` | Awaiting manual approval |
| `infinity-prime` | `#0052cc` | Managed by Infinity Prime |
| `regression` | `#d73a4a` | Automated regression detected |
| `permissions` | `#fbca04` | Permission/secret issue |

## Webhooks (Optional)

For advanced Infinity Prime features:
- Configure webhook for PR events
- Configure webhook for check suite events
- URL: (your monitoring endpoint)
- Content type: `application/json`
- Events: Pull requests, Check suites, Statuses

## Collaborators & Teams

### Recommended Team Structure
- **infinity-prime-admins** - Full access, can override all rules
- **infinity-prime-reviewers** - Can approve Tier 3/4 PRs
- **contributors** - Standard contribution access

## Environments (if using deployments)

### Production
- **Required reviewers:** infinity-prime-admins
- **Wait timer:** 0 minutes (auto-deploy Tier 1/2)
- **Deployment branches:** main only

### Staging
- **Required reviewers:** None
- **Deployment branches:** Any branch

## Notifications

### Email Notifications
Configure personal settings for:
- Pull request reviews
- Check suite failures
- Issue assignments

### Slack/Discord (Optional)
Use GitHub Apps for team notifications

## Security Settings

### Code scanning
- ✅ Enable CodeQL analysis
- ✅ Run on: Pull requests, Push to main
- ✅ Languages: JavaScript, TypeScript

### Dependabot
- ✅ Enable Dependabot alerts
- ✅ Enable Dependabot security updates
- ✅ Enable Dependabot version updates
- Configure: `.github/dependabot.yml`

### Secret scanning
- ✅ Enable secret scanning
- ✅ Enable push protection

## Verification Commands

After configuration, verify settings work:

```bash
# 1. Clone repository
git clone https://github.com/InfinityXOneSystems/foundation.git
cd foundation

# 2. Install dependencies
npm install

# 3. Run validation
npm test
npm run lint

# 4. Test secrets sync
npm run secrets:discover
npm run secrets:status

# 5. Create test PR
git checkout -b test/infinity-prime-check
echo "# Test" > TEST.md
git add TEST.md
git commit -m "test: verify Infinity Prime setup"
git push origin test/infinity-prime-check

# 6. Open PR and verify:
# - PR template appears
# - Workflows run automatically
# - Risk gate assigns tier
# - Checks complete
# - Auto-merge attempts (for Tier 1/2)
```

## Troubleshooting

### Auto-merge not working
- Verify "Allow auto-merge" is enabled
- Check INFINITY_PRIME_APPROVER_TOKEN has correct permissions
- Ensure all required status checks are configured
- Verify PR is not draft
- Check risk tier is 1 or 2

### Workflows not running
- Verify Actions are enabled
- Check workflow permissions (read & write)
- Ensure branch protection doesn't block workflows
- Review workflow logs for errors

### Risk gate failures
- Check `scripts/prime/risk-gate.js` exists
- Verify Node.js is available in workflows
- Review risk gate report in artifacts

## Maintenance

### Regular Tasks
- Review and update risk gate rules monthly
- Update required status checks as needed
- Audit INFINITY_PRIME_APPROVER_TOKEN permissions quarterly
- Review auto-merge statistics monthly

### Updates
- Keep actions versions current
- Update Node.js version as needed
- Review and update security policies

---

Last updated: 2025-12-15
Infinity Prime Version: 1.0.0
