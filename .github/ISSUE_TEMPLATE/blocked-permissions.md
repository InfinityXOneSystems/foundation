---
name: Blocked - Missing Permissions
about: Infinity Prime blocked due to missing secrets or permissions
title: '[BLOCKED] Missing Permissions: '
labels: 'blocked, permissions, configuration'
assignees: ''
---

## Permission Issue
**Detected by:** Infinity Prime Automated System
**Detection Time:** <!-- Auto-filled -->

## Missing Resources
<!-- Mark all that apply -->
- [ ] GitHub Token (GITHUB_TOKEN)
- [ ] Infinity Prime Approver Token (INFINITY_PRIME_APPROVER_TOKEN)
- [ ] Deployment credentials
- [ ] API keys
- [ ] Service account permissions
- [ ] Repository secrets
- [ ] Other: _______________

## Impact
<!-- What operations are blocked? -->
- [ ] Cannot discover repositories
- [ ] Cannot sync secrets
- [ ] Cannot deploy
- [ ] Cannot run integration tests
- [ ] Cannot auto-merge PRs
- [ ] Other: _______________

## Error Message
```
<!-- Paste relevant error messages -->
```

## Required Actions
<!-- Steps to resolve -->
1. **Add Missing Secrets:**
   - Go to: https://github.com/InfinityXOneSystems/foundation/settings/secrets/actions
   - Add the following secrets:
     - [ ] `GITHUB_TOKEN` - GitHub Personal Access Token with repo, workflow scopes
     - [ ] `INFINITY_PRIME_APPROVER_TOKEN` - Token for automated approvals
     - [ ] Other: _______________

2. **Grant Permissions:**
   - [ ] Enable GitHub Actions workflows
   - [ ] Grant workflow write permissions
   - [ ] Enable auto-merge capability
   - [ ] Other: _______________

3. **Verify Configuration:**
   ```bash
   # Check that secrets are accessible
   npm run secrets:status
   
   # Verify GitHub token
   npm run secrets:discover
   ```

## Context
- **Workflow:** 
- **Run:** 
- **Branch:** 
- **Commit:** 

## Resolution Checklist
- [ ] Secrets added to repository
- [ ] Permissions granted
- [ ] Configuration verified
- [ ] Re-run workflow succeeded
- [ ] Infinity Prime can proceed

## Notes
<!-- Additional context or special instructions -->

---
*This issue was automatically created by Infinity Prime. The system has stopped due to missing permissions.*

## Quick Fix Commands
```bash
# Set environment variables locally for testing
export GITHUB_TOKEN="your-token-here"
export INFINITY_PRIME_APPROVER_TOKEN="your-token-here"

# Verify setup
npm run secrets:discover
npm run secrets:status
```
