// scripts/push-github-secrets.js
// Push local .env and secret config values to GitHub repository secrets (exhaustive)
const fs = require("fs");
const path = require("path");
const { Octokit } = require("octokit");
require("dotenv").config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPO || "foundation";
const OWNER = process.env.GITHUB_OWNER || "InfinityXOneSystems";
const ENV_PATH = path.join(__dirname, "../.env.local");
const SECRETS_CONFIG = path.join(__dirname, "../sync-secrets.config.json");

if (!GITHUB_TOKEN) throw new Error("GITHUB_TOKEN not set");
const octokit = new Octokit({ auth: GITHUB_TOKEN });

function parseEnv(file) {
  if (!fs.existsSync(file)) return {};
  return fs.readFileSync(file, "utf-8")
    .split("\n")
    .filter(line => line && !line.startsWith("#"))
    .reduce((acc, line) => {
      const [key, ...rest] = line.split("=");
      acc[key.trim()] = rest.join("=").trim();
      return acc;
    }, {});
}

async function pushSecret(name, value) {
  await octokit.rest.actions.createOrUpdateRepoSecret({
    owner: OWNER,
    repo: REPO,
    secret_name: name,
    encrypted_value: value // For demo only; in production, encrypt with public key
  });
}

async function main() {
  const envVars = parseEnv(ENV_PATH);
  let configVars = {};
  if (fs.existsSync(SECRETS_CONFIG)) {
    configVars = JSON.parse(fs.readFileSync(SECRETS_CONFIG, "utf-8"));
  }
  const allSecrets = { ...envVars, ...configVars };
  for (const [key, value] of Object.entries(allSecrets)) {
    if (value) {
      console.log(`Pushing secret: ${key}`);
      await pushSecret(key, value);
    }
  }
  console.log("All secrets pushed to GitHub repo.");
}

main().catch(err => {
  console.error("Failed to push secrets:", err);
  process.exit(1);
});
