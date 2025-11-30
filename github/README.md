# GitHub App Verification

This folder contains tools and docs to verify the Automation GitHub App.

## Files
- `verify_github_app.py`: Creates a JWT, exchanges it for an installation token, creates a branch + commit, and opens a PR.

## Prerequisites
- Python 3.11+
- `pip install pyjwt requests`
- A generated App private key (PEM) stored securely (Vault/secret store). Do not commit keys.

## Environment Variables
- `GITHUB_APP_ID`: The numeric App ID
- `GITHUB_APP_PRIVATE_KEY_PATH`: Path to PEM private key file (mounted from Vault)
- `GITHUB_APP_INSTALLATION_ID`: The installation ID for the org/repo
- `GITHUB_TEST_REPO` (optional): Defaults to `InfinityXOneSystems/foundation`

## Usage
```bash
python github/verify_github_app.py
```

Expected outcome: A new branch `automation/test-verify-<timestamp>` and a PR titled `AUTOMATION: verification PR`.

## Safety & Governance
- Never store private keys in the repo. Use Vault and mount at runtime.
- The script writes a single file under `automation-verify/README.md` with a safe message.
- Use a sandbox/test repository if desired by setting `GITHUB_TEST_REPO`.
