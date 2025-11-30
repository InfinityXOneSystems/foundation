# ci/secret-scan-policy.md

## Secret Scanning Policy

- All pushes and PRs are scanned for secrets using truffleHog or detect-secrets.
- If a secret is detected, the build fails and must be triaged.
- No secret values are ever output in logs.
- All environment variables must be referenced by name only.
- See onboarding for secret management workflow.
