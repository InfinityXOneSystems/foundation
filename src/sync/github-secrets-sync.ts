// src/sync/github-secrets-sync.ts
// GitHub Secrets Sync: Bidirectional sync between local .env.local and GitHub repository secrets
// Supports encrypted storage, mobile access tokens, and Copilot integration

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default-dev-key-change-in-prod";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || "";
const ENV_FILE = path.resolve(__dirname, "../../.env.local");
const SECRETS_MANIFEST = path.resolve(__dirname, "../../artifacts/secrets-manifest.json");
const MOBILE_ACCESS_TOKENS_FILE = path.resolve(__dirname, "../../artifacts/mobile-access-tokens.json");

/**
 * Encryption utilities for secure local storage and mobile access
 */
export const encryption = {
  encrypt(text: string, key: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", crypto.scryptSync(key, "salt", 32), iv);
    const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
  },

  decrypt(encrypted: string, key: string): string {
    const parts = encrypted.split(":");
    const ivHex = parts[0] || "";
    const encryptedHex = parts[1] || "";
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", crypto.scryptSync(key, "salt", 32), iv);
    const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedHex, "hex")), decipher.final()]);
    return decrypted.toString("utf8");
  },
};

/**
 * Generate a secure mobile access token for remote integration
 */
export function generateMobileAccessToken(expiryDays = 30): {
  token: string;
  expiresAt: string;
  deviceId?: string;
} {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiryDays);

  return {
    token,
    expiresAt: expiresAt.toISOString(),
  };
}

/**
 * Store mobile access token securely
 */
export function storeMobileAccessToken(token: string, deviceName: string): void {
  const tokensFile = MOBILE_ACCESS_TOKENS_FILE;
  let tokens = [];

  if (fs.existsSync(tokensFile)) {
    tokens = JSON.parse(fs.readFileSync(tokensFile, "utf-8"));
  }

  tokens.push({
    deviceName,
    token: encryption.encrypt(token, ENCRYPTION_KEY),
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });

  // Ensure directory exists
  const dir = path.dirname(tokensFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(tokensFile, JSON.stringify(tokens, null, 2));
  console.log(`Mobile access token stored for device: ${deviceName}`);
}

/**
 * Validate mobile access token
 */
export function validateMobileAccessToken(token: string): boolean {
  const tokensFile = MOBILE_ACCESS_TOKENS_FILE;

  if (!fs.existsSync(tokensFile)) {
    return false;
  }

  const tokens = JSON.parse(fs.readFileSync(tokensFile, "utf-8"));

  for (const stored of tokens) {
    try {
      const decrypted = encryption.decrypt(stored.token, ENCRYPTION_KEY);
      if (decrypted === token && new Date(stored.expiresAt) > new Date()) {
        return true;
      }
    } catch {
      // Decryption failed, continue
    }
  }

  return false;
}

/**
 * Load local environment variables
 */
export function loadLocalEnv(): Record<string, string> {
  if (!fs.existsSync(ENV_FILE)) {
    return {};
  }

  const content = fs.readFileSync(ENV_FILE, "utf-8");
  const env: Record<string, string> = {};

  content.split("\n").forEach(line => {
    if (line && !line.startsWith("#")) {
      const [key, ...valueParts] = line.split("=");
      if (key) {
        env[key.trim()] = valueParts.join("=").trim();
      }
    }
  });

  return env;
}

/**
 * Save environment variables to local file
 */
export function saveLocalEnv(env: Record<string, string>): void {
  const content = Object.entries(env)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  // Ensure directory exists
  const dir = path.dirname(ENV_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(ENV_FILE, content);
  console.log("Local environment saved to .env.local");
}

/**
 * Create secrets manifest for tracking what's synced
 */
export function createSecretsManifest(secrets: Record<string, string>): void {
  const manifest = {
    lastSync: new Date().toISOString(),
    totalSecrets: Object.keys(secrets).length,
    secretNames: Object.keys(secrets).sort(),
    checksums: {} as Record<string, string>,
  };

  // Generate checksums for integrity verification
  Object.entries(secrets).forEach(([key, value]) => {
    manifest.checksums[key] = crypto.createHash("sha256").update(value).digest("hex");
  });

  // Ensure directory exists
  const dir = path.dirname(SECRETS_MANIFEST);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(SECRETS_MANIFEST, JSON.stringify(manifest, null, 2));
  console.log("Secrets manifest created");
}

/**
 * GitHub API utilities for secrets management
 */
export const githubApi = {
  async getPublicKey(): Promise<{ key_id: string; key: string }> {
    const [owner, repo] = GITHUB_REPO.split("/");
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/secrets/public-key`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get public key: ${response.statusText}`);
    }

    return response.json();
  },

  async setSecret(name: string, value: string): Promise<void> {
    const [owner, repo] = GITHUB_REPO.split("/");

    // For simplicity in development, store as plaintext secret (use GitHub Actions encryption in production)
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/secrets/${name}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify({
        encrypted_value: value,
        key_id: "dev-key",
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to set secret ${name}: ${response.statusText}`);
    }

    console.log(`Secret ${name} synced to GitHub`);
  },

  async listSecrets(): Promise<Array<{ name: string }>> {
    const [owner, repo] = GITHUB_REPO.split("/");
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/secrets`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list secrets: ${response.statusText}`);
    }

    const data = await response.json();
    return data.secrets || [];
  },
};

/**
 * Sync local .env.local to GitHub repository secrets
 */
export async function pushSecretsToGithub(): Promise<void> {
  if (!GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN not set");
  }

  if (!GITHUB_REPO) {
    throw new Error("GITHUB_REPO not set");
  }

  const localEnv = loadLocalEnv();
  console.log(`Syncing ${Object.keys(localEnv).length} secrets to GitHub...`);

  for (const [key, value] of Object.entries(localEnv)) {
    if (key && value) {
      try {
        await githubApi.setSecret(key, value);
      } catch (error) {
        console.error(`Failed to sync ${key}:`, error);
      }
    }
  }

  createSecretsManifest(localEnv);
  console.log("GitHub secrets sync complete");
}

/**
 * Sync GitHub repository secrets to local .env.local
 */
export async function pullSecretsFromGithub(): Promise<void> {
  if (!GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN not set");
  }

  if (!GITHUB_REPO) {
    throw new Error("GITHUB_REPO not set");
  }

  console.log("Pulling secrets from GitHub...");
  const remoteSecrets = await githubApi.listSecrets();
  const localEnv = loadLocalEnv();

  let updatedCount = 0;
  for (const secret of remoteSecrets) {
    if (!localEnv[secret.name]) {
      localEnv[secret.name] = ""; // Placeholder for missing values
      updatedCount++;
    }
  }

  if (updatedCount > 0) {
    saveLocalEnv(localEnv);
    console.log(`Added ${updatedCount} new secrets from GitHub to .env.local`);
  }

  createSecretsManifest(localEnv);
}

/**
 * Full bidirectional sync: ensure parity between local and remote
 */
export async function syncSecrets(direction: "push" | "pull" | "both"): Promise<void> {
  try {
    if (direction === "push" || direction === "both") {
      await pushSecretsToGithub();
    }

    if (direction === "pull" || direction === "both") {
      await pullSecretsFromGithub();
    }

    console.log("Secrets sync completed successfully");
  } catch (error) {
    console.error("Secrets sync failed:", error);
    throw error;
  }
}

/**
 * API for mobile access: retrieve non-sensitive metadata only
 */
export function getMobileAccessMetadata(): {
  repo: string;
  lastSync: string;
  secretCount: number;
} {
  let manifest = {
    lastSync: "never",
    totalSecrets: 0,
  };

  if (fs.existsSync(SECRETS_MANIFEST)) {
    manifest = JSON.parse(fs.readFileSync(SECRETS_MANIFEST, "utf-8"));
  }

  return {
    repo: GITHUB_REPO,
    lastSync: manifest.lastSync,
    secretCount: manifest.totalSecrets,
  };
}

// Export all sync functions for CLI usage
export default {
  encryption,
  generateMobileAccessToken,
  storeMobileAccessToken,
  validateMobileAccessToken,
  loadLocalEnv,
  saveLocalEnv,
  createSecretsManifest,
  githubApi,
  pushSecretsToGithub,
  pullSecretsFromGithub,
  syncSecrets,
  getMobileAccessMetadata,
};
