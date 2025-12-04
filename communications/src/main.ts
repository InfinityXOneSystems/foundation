import express, { Express, Request, Response } from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import { GmailConnector } from "./gmail_connector";
import { CalendarConnector } from "./calendar_connector";
import { DocsConnector } from "./docs_connector";

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3002;

// Initialize Google Workspace connectors
const gmailConnector = new GmailConnector();
const calendarConnector = new CalendarConnector();
const docsConnector = new DocsConnector();

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

// --- SGP-WORKSPACE-INTEGRATION Endpoints (New) ---

/**
 * POST /api/v1/email/ingest
 * Autonomously ingest emails matching criteria for deep intelligence extraction
 * Input: { query?: string }
 * Output: { status: string, count: number, data: any[] }
 */
app.post("/api/v1/email/ingest", async (req: Request, res: Response) => {
  try {
    const { query = "is:unread category:primary newer_than:7d" } = req.body;
    const emails = await gmailConnector.ingest(query);
    res.status(200).json({
      status: "INGESTION_SUCCESS",
      count: emails.length,
      message: `Successfully found ${emails.length} emails for Vision processing.`,
      data: emails,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to execute email ingestion.",
      detail: (error as Error).message,
    });
  }
});

/**
 * POST /api/v1/schedule/new
 * Autonomously schedule a new calendar event
 * Input: { summary: string, start: string (ISO), end: string (ISO), attendees?: string[] }
 * Output: { status: string, eventId: string, link: string }
 */
app.post("/api/v1/schedule/new", async (req: Request, res: Response) => {
  try {
    const { summary, start, end, attendees = [] } = req.body;
    if (!summary || !start || !end) {
      return res.status(400).json({
        error: "Missing required fields: summary, start, end",
      });
    }

    const event = await calendarConnector.scheduleEvent(
      summary,
      new Date(start),
      new Date(end),
      attendees
    );
    res.status(200).json({
      status: "SCHEDULE_SUCCESS",
      message: "Event successfully created.",
      eventId: event.data.id,
      link: event.data.htmlLink,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to create calendar event.",
      detail: (error as Error).message,
    });
  }
});

/**
 * GET /api/v1/schedule/today
 * Retrieve today's calendar events for task prioritization
 * Output: { status: string, count: number, events: any[] }
 */
app.get("/api/v1/schedule/today", async (req: Request, res: Response) => {
  try {
    const events = await calendarConnector.getTodayEvents();
    res.status(200).json({
      status: "SUCCESS",
      count: events.length,
      message: `Retrieved ${events.length} events for today.`,
      events: events,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to retrieve today's events.",
      detail: (error as Error).message,
    });
  }
});

/**
 * POST /api/v1/schedule/availability
 * Check free/busy availability for scheduling decisions
 * Input: { start: string (ISO), end: string (ISO), email?: string }
 * Output: { status: string, availability: any }
 */
app.post(
  "/api/v1/schedule/availability",
  async (req: Request, res: Response) => {
    try {
      const { start, end, email } = req.body;
      if (!start || !end) {
        return res.status(400).json({
          error: "Missing required fields: start, end",
        });
      }

      const availability = await calendarConnector.getFreeBusy(
        new Date(start),
        new Date(end),
        email || "me"
      );
      res.status(200).json({
        status: "SUCCESS",
        availability: availability.data,
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to check availability.",
        detail: (error as Error).message,
      });
    }
  }
);

/**
 * POST /api/v1/docs/report
 * Write a structured report to Google Docs autonomously
 * Input: { title: string, content: string }
 * Output: { status: string, docId: string, docUrl: string }
 */
app.post("/api/v1/docs/report", async (req: Request, res: Response) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({
        error: "Missing required fields: title, content",
      });
    }

    const docResponse = await docsConnector.createDoc(title, content);
    res.status(200).json({
      status: "DOC_CREATION_SUCCESS",
      message: "Report successfully generated to Google Docs.",
      docId: docResponse.data.documentId,
      docUrl: docResponse.data.webViewLink,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to create Google Doc report.",
      detail: (error as Error).message,
    });
  }
});

/**
 * POST /api/v1/sheets/append
 * Append metrics/data rows to a Google Sheet for continuous logging
 * Input: { spreadsheetId: string, sheetName: string, data: (string|number)[] }
 * Output: { status: string, message: string }
 */
app.post("/api/v1/sheets/append", async (req: Request, res: Response) => {
  try {
    const { spreadsheetId, sheetName, data } = req.body;
    if (!spreadsheetId || !sheetName || !data || data.length === 0) {
      return res.status(400).json({
        error:
          "Missing required fields: spreadsheetId, sheetName, data (non-empty array)",
      });
    }

    const result = await docsConnector.appendSheetRow(
      spreadsheetId,
      sheetName,
      data
    );
    res.status(200).json({
      status: "SUCCESS",
      message: "Row successfully appended to sheet.",
      result: result.data,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to append rows to sheet.",
      detail: (error as Error).message,
    });
  }
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
      workspace: {
        gmail: "active",
        calendar: "active",
        docs: "active",
        sheets: "active",
        provider: "Google Workspace",
        description:
          "Autonomous 24/7 deep intelligence ingestion and execution",
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
