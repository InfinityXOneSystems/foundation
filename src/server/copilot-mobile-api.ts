// src/server/copilot-mobile-api.ts
// GitHub Copilot Mobile Integration API
// Enables secure remote access, secrets sync, and Copilot orchestration from mobile devices

import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import {
  validateMobileAccessToken,
  getMobileAccessMetadata,
  syncSecrets,
  generateMobileAccessToken,
  storeMobileAccessToken,
} from "../sync/github-secrets-sync";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

/**
 * Middleware: Validate mobile access token
 */
function validateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  const token = authHeader.substring(7);

  if (!validateMobileAccessToken(token)) {
    res.status(403).json({ error: "Invalid or expired access token" });
    return;
  }

  next();
}

/**
 * Health check endpoint
 */
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

/**
 * Generate mobile access token (requires GITHUB_TOKEN in header for security)
 */
app.post("/auth/generate-token", (req: Request, res: Response) => {
  const deviceName = req.body.deviceName || "unknown-device";
  const adminKey = req.headers["x-admin-key"];

  if (adminKey !== process.env.ADMIN_KEY) {
    res.status(403).json({ error: "Invalid admin key" });
    return;
  }

  const { token, expiresAt } = generateMobileAccessToken(30);
  storeMobileAccessToken(token, deviceName);

  res.json({
    token,
    expiresAt,
    message: "Mobile access token generated successfully",
  });
});

/**
 * Get sync metadata (accessible with valid token)
 */
app.get("/sync/metadata", validateToken, (_req: Request, res: Response) => {
  try {
    const metadata = getMobileAccessMetadata();
    res.json(metadata);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

/**
 * Trigger secrets sync (push/pull/both)
 */
app.post("/sync/secrets", validateToken, async (req: Request, res: Response) => {
  const { direction } = req.body;

  if (!["push", "pull", "both"].includes(direction)) {
    res.status(400).json({ error: "Invalid direction. Use: push, pull, or both" });
    return;
  }

  try {
    await syncSecrets(direction);
    res.json({
      status: "success",
      message: `Secrets sync completed (${direction})`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

/**
 * Get current orchestration status (for Copilot integration)
 */
app.get("/orchestration/status", validateToken, (req: Request, res: Response) => {
  res.json({
    status: "operational",
    version: "1.0.0",
    capabilities: [
      "github-secrets-sync",
      "mobile-access",
      "copilot-integration",
      "encrypted-storage",
    ],
    endpoints: [
      "/health",
      "/auth/generate-token",
      "/sync/metadata",
      "/sync/secrets",
      "/orchestration/status",
      "/orchestration/exec",
    ],
  });
});

/**
 * Execute orchestration command (for Copilot remote execution)
 */
app.post("/orchestration/exec", validateToken, (req: Request, res: Response) => {
  const { command, params } = req.body;

  // Authorized commands only
  const allowedCommands = ["sync-secrets", "get-status", "health-check"];

  if (!allowedCommands.includes(command)) {
    res.status(400).json({ error: `Command not allowed: ${command}` });
    return;
  }

  try {
    switch (command) {
      case "sync-secrets":
        res.json({
          status: "queued",
          command,
          message: "Sync initiated in background",
        });
        // Execute async in background
        syncSecrets(params?.direction || "both").catch(err => console.error(err));
        break;

      case "get-status":
        res.json({
          status: "operational",
          timestamp: new Date().toISOString(),
        });
        break;

      case "health-check":
        res.json({
          status: "healthy",
          timestamp: new Date().toISOString(),
        });
        break;

      default:
        res.status(400).json({ error: "Unknown command" });
    }
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

/**
 * Error handler
 */
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

/**
 * Start server
 */
export function startServer() {
  app.listen(PORT, () => {
    console.log(`✅ Copilot Mobile API running on http://localhost:${PORT}`);
    console.log("📱 Mobile integration ready");
    console.log("🔐 GitHub secrets sync enabled");
    console.log("\nEndpoints:");
    console.log("  GET  /health");
    console.log("  POST /auth/generate-token (requires X-Admin-Key)");
    console.log("  GET  /sync/metadata (requires Bearer token)");
    console.log("  POST /sync/secrets (requires Bearer token)");
    console.log("  GET  /orchestration/status (requires Bearer token)");
    console.log("  POST /orchestration/exec (requires Bearer token)");
  });
}

export default app;

// Start if run directly
if (require.main === module) {
  startServer();
}
