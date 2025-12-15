# Contributing to Infinity Prime

## Overview
This repository uses **Infinity Prime**, a zero-human-approval autonomous system for CI/CD operations. Understanding how it works will help you contribute effectively.

## What is Infinity Prime?

Infinity Prime is an internal, bounded self-optimizing system that:
- Automatically validates, tests, lints, and builds all changes
- Classifies PRs into risk tiers (1-4)
- Auto-merges low-risk PRs when all checks pass
- Blocks high-risk PRs and opens issues for manual review
- Prevents runaway automation with hard safety stops

## Risk Tier Classification

### Tier 1: Auto-Merge (Lowest Risk)
- Documentation-only changes
- Test additions/improvements
- Minor formatting fixes
- Comment updates
- README updates

**Action:** Automatically merged when CI passes

### Tier 2: Auto-Merge (Low Risk)
- Bug fixes with tests
- New features with full test coverage
- Dependency patch/minor updates
- Configuration tweaks
- Non-breaking refactors

**Action:** Automatically merged when all checks pass + RiskGate = SAFE

### Tier 3: Manual Review Required (Medium Risk)
- Significant architectural changes
- Changes to critical paths (auth, payments, data integrity)
- Database schema modifications
- Security-sensitive code
- Performance-critical changes

**Action:** CI runs, but PR blocked for manual approval

### Tier 4: Manual Review Required (High Risk)
- Breaking API changes
- Infrastructure/deployment configuration
- Changes affecting multiple services
- Dependency major version updates
- Security patches affecting core systems

**Action:** CI runs, but PR blocked for senior engineer approval

## How to Contribute

### 1. Before You Start
```bash
# Fork and clone the repository
git clone https://github.com/InfinityXOneSystems/foundation.git
cd foundation

# Install dependencies
npm install

# Verify setup
npm test
npm run lint
npm run typecheck
```

### 2. Create Your Branch
```bash
# Use descriptive branch names
git checkout -b fix/issue-123-memory-leak
git checkout -b feat/add-caching-layer
git checkout -b docs/update-api-documentation
```

### 3. Make Changes
- Write clean, well-documented code
- Add tests for new features
- Update documentation
- Follow existing code style

### 4. Run Local Validation
```bash
# Run all checks that Infinity Prime will run
npm run lint
npm run typecheck
npm test
npm run build  # if applicable

# Optional: integration tests
npm run test:integration  # if available
```

### 5. Commit and Push
```bash
git add .
git commit -m "fix: resolve memory leak in cache module"
git push origin fix/issue-123-memory-leak
```

### 6. Open Pull Request
- Use the PR template (auto-populated)
- Fill in all sections
- Don't manually edit auto-populated fields (Tier, Workflow Links)

### 7. Wait for Infinity Prime
**Automatic Process:**
1. CI runs all validations
2. Risk Gate analyzes changes
3. PR template updated with tier and links
4. Decision made:
   - **Tier 1/2 + All Pass:** Auto-merged ✅
   - **Tier 3/4:** Issue opened for approval 🔒
   - **Any Failure:** Regression issue opened 🐛

## Hard Safety Stops

Infinity Prime stops automatically when:
- **Time budget exceeded:** 60 minutes
- **Attempt budget exceeded:** 3 fix cycles
- **Regression persists:** After 3 attempts
- **Missing permissions:** Cannot access secrets
- **Tier 3/4 detected:** Requires human approval

When stopped, Infinity Prime opens an issue with details.

## PR Template Auto-Population

**DO NOT manually edit these fields:**
- `<!-- TIER_PLACEHOLDER -->` - Auto-filled by risk-gate.js
- `<!-- CI_RUN_LINK -->` - Auto-filled by update-pr-links.js
- `<!-- INTEGRATION_RUN_LINK -->` - Auto-filled by update-pr-links.js
- `<!-- SMOKE_RUN_LINK -->` - Auto-filled by update-pr-links.js
- `<!-- ENFORCER_RUN_LINK -->` - Auto-filled by update-pr-links.js

These are automatically populated during CI runs.

## Debugging Failed Checks

### Check Failed
```bash
# View the specific check output in GitHub Actions
# Common fixes:
npm run lint -- --fix
npm run test -- --updateSnapshot
```

### Integration Tests Failed
```bash
# Run locally with Firestore emulator
npm run test:integration
```

### Smoke Tests Failed
```bash
# Start local server
npm run api:dev

# Test endpoints manually
curl http://localhost:3000/healthz
curl http://localhost:3000/api/info
```

## Common Issues

### "Blocked - Approval Required"
Your PR is Tier 3 or 4. A maintainer will review and approve/reject.

### "Regression Detected"
Infinity Prime tried to fix it automatically but failed. Check the issue for details.

### "Missing Permissions"
Required secrets aren't configured. Check the blocked-permissions issue.

### "Auto-merge Not Triggered"
Ensure:
- All checks pass (green)
- PR is Tier 1 or 2
- RiskGate shows SAFE
- No conflicts with main

## Best Practices

### Write Tests
```typescript
// Good: Comprehensive test
describe('CacheModule', () => {
  it('should evict old entries', () => {
    // Test implementation
  });
});
```

### Document Changes
```typescript
/**
 * Caches API responses for 5 minutes
 * @param key - Cache key
 * @param value - Value to cache
 */
function cache(key: string, value: any): void {
  // Implementation
}
```

### Keep PRs Focused
- One feature/fix per PR
- Small, reviewable diffs
- Clear commit messages

### Security
- Never commit secrets
- Use environment variables
- Validate all inputs
- Follow security best practices

## Need Help?

- Check existing issues
- Read the documentation
- Ask in discussions
- Tag maintainers for urgent issues

## Advanced: Customizing Infinity Prime

### Risk Gate Rules
Edit `scripts/prime/risk-gate.js` to adjust tier classification logic.

### Validation Steps
Edit `scripts/prime/full-validation.js` to add custom validation steps.

### Workflow Configuration
Edit `.github/workflows/*.yml` to customize CI/CD pipelines.

---

**Remember:** Infinity Prime is designed to reduce friction, not add bureaucracy. If something seems wrong, open an issue!
