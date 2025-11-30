# docs/ops/runbooks/onboarding.md

# Onboarding Runbook

1. Clone the repo and install dependencies.
2. Copy `.env.example` to `.env.local` and fill in all required values (see onboarding docs).
3. Set up Google Cloud service account and download credentials to `config/google-service-account.json`.
4. Configure GitHub, Hostinger, and ChatGPT API keys in `.env.local`.
5. Deploy backend to Railway and set up GCP Functions and Pub/Sub.
6. Run initial pipeline validation: `npm run lint && npm test && npx tsc --noEmit`.
7. Review CI and Dependabot status on GitHub.
8. See `docs/automation/pipeline-plan.md` for full architecture.
