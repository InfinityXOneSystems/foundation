#!/usr/bin/env python3
"""
GitHub App verification script

Usage:
  - Set env vars for GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY_PATH, GITHUB_APP_INSTALLATION_ID
  - Optionally set GITHUB_TEST_REPO (default: InfinityXOneSystems/foundation)
  - This script creates a JWT, exchanges for an installation token,
    creates a branch and small commit, and opens a PR to verify flows.

Safety:
  - Do not commit real private keys. Point GITHUB_APP_PRIVATE_KEY_PATH to a secure location
    or mount from Vault/secret store.
"""

import os
import time
import jwt
import requests
from base64 import b64encode

GITHUB_API = "https://api.github.com"

GITHUB_APP_ID = os.getenv("GITHUB_APP_ID")
PRIVATE_KEY_PATH = os.getenv("GITHUB_APP_PRIVATE_KEY_PATH")
INSTALLATION_ID = os.getenv("GITHUB_APP_INSTALLATION_ID")
REPO = os.getenv("GITHUB_TEST_REPO", "InfinityXOneSystems/foundation")
BRANCH_NAME = f"automation/test-verify-{int(time.time())}"
COMMIT_FILE_PATH = "automation-verify/README.md"


def create_jwt(app_id: str, private_key_path: str) -> str:
    now = int(time.time())
    with open(private_key_path, "r", encoding="utf-8") as f:
        private_key = f.read()
    payload = {
        "iat": now - 60,
        "exp": now + (10 * 60),
        "iss": app_id,
    }
    encoded_jwt = jwt.encode(payload, private_key, algorithm="RS256")
    return encoded_jwt


def create_installation_token(jwt_token: str, installation_id: str) -> str:
    url = f"{GITHUB_API}/app/installations/{installation_id}/access_tokens"
    headers = {
        "Authorization": f"Bearer {jwt_token}",
        "Accept": "application/vnd.github+json",
    }
    r = requests.post(url, headers=headers, timeout=30)
    r.raise_for_status()
    return r.json()["token"]


def create_branch_and_pr(token: str, repo: str, branch: str, file_path: str) -> dict:
    headers = {"Authorization": f"token {token}", "Accept": "application/vnd.github+json"}
    owner, name = repo.split("/")
    # get default branch sha
    r = requests.get(f"{GITHUB_API}/repos/{owner}/{name}", headers=headers, timeout=30)
    r.raise_for_status()
    default_branch = r.json()["default_branch"]

    r = requests.get(
        f"{GITHUB_API}/repos/{owner}/{name}/git/ref/heads/{default_branch}",
        headers=headers,
        timeout=30,
    )
    r.raise_for_status()
    sha = r.json()["object"]["sha"]

    # create new branch
    payload = {"ref": f"refs/heads/{branch}", "sha": sha}
    r = requests.post(f"{GITHUB_API}/repos/{owner}/{name}/git/refs", json=payload, headers=headers, timeout=30)
    r.raise_for_status()

    # create a file
    content = "Automation verification file.\n"
    data = {
        "message": "chore: add automation verification file",
        "content": b64encode(content.encode()).decode(),
        "branch": branch,
    }
    r = requests.put(
        f"{GITHUB_API}/repos/{owner}/{name}/contents/{file_path}",
        json=data,
        headers=headers,
        timeout=30,
    )
    r.raise_for_status()

    # create PR
    pr = {
        "title": "AUTOMATION: verification PR",
        "head": branch,
        "base": default_branch,
        "body": "This PR verifies GitHub App can create branches & commits.",
    }
    r = requests.post(f"{GITHUB_API}/repos/{owner}/{name}/pulls", json=pr, headers=headers, timeout=30)
    r.raise_for_status()
    return r.json()


def main() -> None:
    jwt_token = create_jwt(GITHUB_APP_ID, PRIVATE_KEY_PATH)
    print("Created JWT. Exchanging for installation token...")
    token = create_installation_token(jwt_token, INSTALLATION_ID)
    print("Got installation token; creating branch & PR...")
    pr = create_branch_and_pr(token, REPO, BRANCH_NAME, COMMIT_FILE_PATH)
    print("PR created:", pr.get("html_url"))


if __name__ == "__main__":
    missing = []
    for k in ("GITHUB_APP_ID", "GITHUB_APP_PRIVATE_KEY_PATH", "GITHUB_APP_INSTALLATION_ID"):
        if not os.getenv(k):
            missing.append(k)
    if missing:
        print("Missing env vars:", missing)
        print(
            "Set GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY_PATH, GITHUB_APP_INSTALLATION_ID, and optionally GITHUB_TEST_REPO",
        )
        raise SystemExit(1)
    main()
