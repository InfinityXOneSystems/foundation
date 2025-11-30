#!/usr/bin/env node
// scripts/sync-secrets-cli.ts
// Command-line interface for GitHub secrets synchronization
// Usage: node scripts/sync-secrets-cli.js [push|pull|both|mobile]

import dotenv from "dotenv";

// Load environment
dotenv.config();

// Dynamic import for async/await support
const syncModule = require("../src/sync/github-secrets-sync");

const {
  syncSecrets,
  generateMobileAccessToken,
  storeMobileAccessToken,
  getMobileAccessMetadata,
} = syncModule;

const command = process.argv[2] || "both";

async function main() {
  try {
    switch (command) {
      case "push":
        console.log("📤 Pushing secrets to GitHub...");
        await syncSecrets("push");
        console.log("✅ Push complete");
        break;

      case "pull":
        console.log("📥 Pulling secrets from GitHub...");
        await syncSecrets("pull");
        console.log("✅ Pull complete");
        break;

      case "both":
        console.log("🔄 Syncing secrets (bidirectional)...");
        await syncSecrets("both");
        console.log("✅ Sync complete");
        break;

      case "mobile":
        console.log("📱 Setting up mobile access...");
        const deviceName = process.argv[3] || "mobile-device";
        const { token, expiresAt } = generateMobileAccessToken(30);
        storeMobileAccessToken(token, deviceName);
        console.log(`✅ Mobile access token generated for ${deviceName}`);
        console.log(`Token: ${token}`);
        console.log(`Expires: ${expiresAt}`);
        console.log("\nTo use this token with the mobile API:");
        console.log(`  Authorization: Bearer ${token}`);
        break;

      case "status":
        console.log("📊 Sync status:");
        const metadata = getMobileAccessMetadata();
        console.log(`  Repository: ${metadata.repo}`);
        console.log(`  Last Sync: ${metadata.lastSync}`);
        console.log(`  Total Secrets: ${metadata.secretCount}`);
        break;

      case "help":
        console.log("GitHub Secrets Sync CLI");
        console.log("\nUsage: node sync-secrets-cli.js [command] [options]");
        console.log("\nCommands:");
        console.log("  push              - Push local .env.local to GitHub secrets");
        console.log("  pull              - Pull GitHub secrets to local .env.local");
        console.log("  both              - Bidirectional sync (default)");
        console.log("  mobile <device>   - Generate mobile access token");
        console.log("  status            - Show sync status");
        console.log("  help              - Show this help message");
        break;

      default:
        console.error(`Unknown command: ${command}`);
        console.log("Run with 'help' for usage information");
        process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main();
