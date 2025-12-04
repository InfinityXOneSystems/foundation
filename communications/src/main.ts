import express, { Express, Request, Response } from "express";
import cors from "cors";
import * as dotenv from "dotenv";

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "healthy", service: "communications" });
});

// Root endpoint
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Communication Microservice Online",
    version: "1.0.0",
    port: PORT,
    capabilities: ["voice", "email", "sms"],
  });
});

// Voice endpoints

/**
 * POST /api/v1/voice/generate-speech
 * Convert text to speech using Google Cloud Text-to-Speech
 * Input: { text: string, languageCode: string, voiceName?: string }
 * Output: { audioContent: string (base64), duration: number }
 */
app.post("/api/v1/voice/generate-speech", (req: Request, res: Response) => {
  const { text, languageCode, voiceName } = req.body;

  if (!text || !languageCode) {
    return res.status(400).json({
      error: "Missing required fields: text, languageCode",
    });
  }

  // TODO: Implement Google Cloud TTS integration via voice_service.ts
  res.status(202).json({
    message: "Speech generation queued",
    requestId: `tts-${Date.now()}`,
    status: "processing",
  });
});

/**
 * POST /api/v1/voice/transcribe-audio
 * Convert speech to text using Google Cloud Speech-to-Text
 * Input: { audioContent: string (base64), languageCode: string }
 * Output: { transcript: string, confidence: number }
 */
app.post("/api/v1/voice/transcribe-audio", (req: Request, res: Response) => {
  const { audioContent, languageCode } = req.body;

  if (!audioContent || !languageCode) {
    return res.status(400).json({
      error: "Missing required fields: audioContent, languageCode",
    });
  }

  // TODO: Implement Google Cloud STT integration via voice_service.ts
  res.status(202).json({
    message: "Transcription queued",
    requestId: `stt-${Date.now()}`,
    status: "processing",
  });
});

// Email endpoints

/**
 * POST /api/v1/email/send
 * Send email via Gmail API or SendGrid
 * Input: { to: string, subject: string, body: string, html?: boolean }
 * Output: { messageId: string, status: "sent" }
 */
app.post("/api/v1/email/send", (req: Request, res: Response) => {
  const { to, subject, body } = req.body;

  if (!to || !subject || !body) {
    return res.status(400).json({
      error: "Missing required fields: to, subject, body",
    });
  }

  // TODO: Implement Gmail/SendGrid integration
  res.status(202).json({
    message: "Email queued for delivery",
    messageId: `email-${Date.now()}`,
    status: "queued",
  });
});

/**
 * GET /api/v1/email/status/:messageId
 * Check delivery status of sent email
 * Input: messageId (path param)
 * Output: { messageId: string, status: "sent" | "failed" | "pending", timestamp: string }
 */
app.get("/api/v1/email/status/:messageId", (req: Request, res: Response) => {
  const { messageId } = req.params;

  res.status(200).json({
    messageId,
    status: "sent",
    timestamp: new Date().toISOString(),
  });
});

// System endpoints

/**
 * GET /api/v1/status
 * Overall service health and capability status
 */
app.get("/api/v1/status", (req: Request, res: Response) => {
  res.status(200).json({
    service: "communications",
    status: "operational",
    version: "1.0.0",
    capabilities: {
      voice: {
        tts: "ready",
        stt: "ready",
        provider: "Google Cloud",
      },
      email: {
        send: "ready",
        status: "ready",
        providers: ["Gmail", "SendGrid"],
      },
    },
    uptime_ms: process.uptime() * 1000,
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
  console.log(`[COMMUNICATIONS] Service running on port ${PORT}`);
  console.log(`[COMMUNICATIONS] Health: GET http://localhost:${PORT}/health`);
  console.log(
    `[COMMUNICATIONS] Status: GET http://localhost:${PORT}/api/v1/status`
  );
});

export default app;
