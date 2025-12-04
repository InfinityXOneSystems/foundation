import express, { Express, Request, Response } from "express";
import cors from "cors";
import * as dotenv from "dotenv";

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "healthy", service: "storage" });
});

// Root endpoint
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Storage Microservice Online",
    version: "1.0.0",
    port: PORT,
    capabilities: ["file-upload", "file-retrieve", "list-files", "delete-file"],
  });
});

// Google Drive file operations

/**
 * POST /api/v1/files/upload
 * Upload file to Google Drive
 * Input: { fileName: string, content: string (base64), mimeType: string, parentFolderId?: string }
 * Output: { fileId: string, name: string, webViewLink: string }
 */
app.post("/api/v1/files/upload", (req: Request, res: Response) => {
  const { fileName, content, mimeType, parentFolderId } = req.body;

  if (!fileName || !content || !mimeType) {
    return res.status(400).json({
      error: "Missing required fields: fileName, content, mimeType",
    });
  }

  // TODO: Implement Google Drive API integration via drive_connector.ts
  res.status(202).json({
    message: "File upload queued",
    requestId: `upload-${Date.now()}`,
    status: "processing",
  });
});

/**
 * GET /api/v1/files/:fileId
 * Retrieve file from Google Drive by fileId
 * Output: { fileId: string, name: string, content: string (base64), mimeType: string, createdTime: string }
 */
app.get("/api/v1/files/:fileId", (req: Request, res: Response) => {
  const { fileId } = req.params;

  // TODO: Implement Google Drive file download via drive_connector.ts
  res.status(200).json({
    message: "File retrieval not yet implemented",
    fileId,
  });
});

/**
 * GET /api/v1/files
 * List all files in user's Google Drive (with optional query/filter)
 * Query params: { query?: string, pageSize?: number }
 * Output: { files: Array<{fileId, name, mimeType, createdTime}>, nextPageToken?: string }
 */
app.get("/api/v1/files", (req: Request, res: Response) => {
  const { query, pageSize } = req.query;

  // TODO: Implement Google Drive file listing via drive_connector.ts
  res.status(200).json({
    files: [],
    message: "File listing not yet implemented",
  });
});

/**
 * DELETE /api/v1/files/:fileId
 * Delete file from Google Drive
 * Output: { fileId: string, status: "deleted" }
 */
app.delete("/api/v1/files/:fileId", (req: Request, res: Response) => {
  const { fileId } = req.params;

  // TODO: Implement Google Drive file deletion via drive_connector.ts
  res.status(202).json({
    message: "File deletion queued",
    fileId,
    status: "queued",
  });
});

/**
 * POST /api/v1/search
 * Advanced search for files in Google Drive
 * Input: { query: string, mimeType?: string, createdAfter?: string, createdBefore?: string }
 * Output: { files: Array<{fileId, name, mimeType, createdTime}> }
 */
app.post("/api/v1/search", (req: Request, res: Response) => {
  const { query, mimeType, createdAfter, createdBefore } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Missing required field: query" });
  }

  // TODO: Implement advanced Google Drive search via drive_connector.ts
  res.status(200).json({
    files: [],
    message: "Search not yet implemented",
  });
});

// System endpoints

/**
 * GET /api/v1/status
 * Overall service health and storage quota status
 */
app.get("/api/v1/status", (req: Request, res: Response) => {
  res.status(200).json({
    service: "storage",
    status: "operational",
    version: "1.0.0",
    provider: "Google Drive",
    capabilities: {
      upload: "ready",
      download: "ready",
      list: "ready",
      search: "ready",
      delete: "ready",
    },
    quota: {
      storageQuotaBytes: 15 * 1024 * 1024 * 1024, // 15 GB (Google Drive free tier)
      usageBytes: 0, // TODO: Fetch from Google Drive API
    },
    uptime_ms: process.uptime() * 1000,
  });
});

/**
 * GET /api/v1/quota
 * Detailed storage quota information
 */
app.get("/api/v1/quota", (req: Request, res: Response) => {
  res.status(200).json({
    totalStorageQuotaBytes: 15 * 1024 * 1024 * 1024, // 15 GB
    usedStorageBytes: 0,
    freeStorageBytes: 15 * 1024 * 1024 * 1024,
    percentageUsed: 0,
  });
});

// Error handler
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
);

// Start server
app.listen(PORT, () => {
  console.log(`[STORAGE] Service running on port ${PORT}`);
  console.log(`[STORAGE] Health: GET http://localhost:${PORT}/health`);
  console.log(`[STORAGE] Status: GET http://localhost:${PORT}/api/v1/status`);
});

export default app;
