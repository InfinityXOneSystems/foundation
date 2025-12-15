---
name: Infinity Prime Regression
about: Report a regression detected by Infinity Prime automated validation
title: '[REGRESSION] '
labels: 'regression, infinity-prime, priority-high'
assignees: ''
---

## Regression Detection Summary
**Detected by:** Infinity Prime Automated Validation
**Detection Time:** <!-- Auto-filled -->
**Attempt:** <!-- X of 3 -->

## Failed Validation Stage
<!-- Which stage failed: lint, typecheck, test, integration, smoke, contract -->
**Stage:** 

## Error Details
```
<!-- Paste error output here -->
```

## Reproduction Steps
1. Branch: 
2. Commit: 
3. Command that failed: 

## Automated Fix Attempts
- Attempt 1: <!-- Status -->
- Attempt 2: <!-- Status -->
- Attempt 3: <!-- Status -->

## Context
- **PR Number:** #
- **Original Issue:** #
- **Related Changes:** 

## Safety Stop Triggered
<!-- Mark which safety stop was triggered -->
- [ ] Time budget exceeded (60 minutes)
- [ ] Attempt budget exceeded (3 attempts)
- [ ] Regression persists after 3 fix cycles
- [ ] Risk Gate tier BLOCKED

## Next Steps
<!-- Infinity Prime has stopped. Manual intervention required. -->
- [ ] Review error details
- [ ] Identify root cause
- [ ] Apply manual fix
- [ ] Re-run validation
- [ ] Update Infinity Prime rules (if pattern should be prevented)

## Logs
<!-- Link to workflow artifacts -->
- Workflow Run: 
- Artifacts: 

---
*This issue was automatically created by Infinity Prime. The system has stopped and requires human review.*
