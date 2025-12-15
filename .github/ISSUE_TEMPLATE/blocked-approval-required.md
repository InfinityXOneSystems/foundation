---
name: Blocked - Approval Required
about: PR blocked by Infinity Prime - Requires manual approval (Tier 3/4)
title: '[BLOCKED] Approval Required: '
labels: 'blocked, requires-approval, tier-3-4'
assignees: ''
---

## Approval Request
**PR Number:** #
**Risk Tier:** <!-- Tier 3 or Tier 4 -->
**Blocked Reason:** High-risk changes detected - Manual review required

## Risk Gate Analysis
```json
<!-- Auto-filled from RISK_GATE_REPORT.json -->
{
  "tier": "",
  "score": 0,
  "blocking_factors": []
}
```

## Changes Summary
<!-- High-level summary of what changed -->

## Why Manual Approval Required
<!-- Mark applicable reasons -->
- [ ] Tier 3: Significant architectural changes
- [ ] Tier 3: Changes to critical paths (auth, payments, data integrity)
- [ ] Tier 3: Database schema modifications
- [ ] Tier 3: Security-sensitive code changes
- [ ] Tier 4: Breaking API changes
- [ ] Tier 4: Infrastructure/deployment configuration changes
- [ ] Tier 4: Changes affecting multiple services
- [ ] Tier 4: Dependency major version updates

## Risk Factors Detected
<!-- Specific risk factors from risk gate analysis -->
1. 
2. 
3. 

## Validation Status
All automated checks completed:
- [ ] CI: PASSED
- [ ] Integration: PASSED
- [ ] Smoke: PASSED
- [ ] TypeCheck: PASSED
- [ ] Lint: PASSED
- [ ] Tests: PASSED
- [ ] Contract Check: PASSED (if applicable)

## Approver Checklist
Before approving, verify:
- [ ] Code review completed thoroughly
- [ ] Security implications assessed
- [ ] Breaking changes documented
- [ ] Migration plan exists (if needed)
- [ ] Rollback plan documented
- [ ] Stakeholders notified
- [ ] Documentation updated

## Approval Decision
<!-- To be filled by approver -->
- **Approved by:** @
- **Decision:** APPROVE / REQUEST_CHANGES / REJECT
- **Conditions:** 
- **Notes:** 

---
*This issue was automatically created by Infinity Prime. PR cannot be auto-merged due to high risk tier.*
