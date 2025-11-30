// src/orchestrator/smart-router.ts
// Main orchestrator for agent routing, memory, and eventing
import { handleGithubEvent } from "../agents/github-copilot";
import { handleGeminiEvent } from "../agents/gemini";
import { handleHostingerEvent } from "../agents/hostinger";
import { handleChatGPTEvent } from "../agents/chatgpt";
import { syncMemory } from "../memory/google-drive";
import express from "express";
import { log } from "../utils/logger";

const app = express();
app.use(express.json());

// Example endpoint for agent event routing
  const { agent, event } = req.body;
  log(`Route event: agent=${agent}, event=${JSON.stringify(event)}`);
  let result;
  switch (agent) {
    case "github":
      result = await handleGithubEvent(event);
      break;
    case "gemini":
      result = await handleGeminiEvent(event);
      break;
    case "hostinger":
      result = await handleHostingerEvent(event);
      break;
    case "chatgpt":
      result = await handleChatGPTEvent(event);
      break;
    default:
      result = { error: "Unknown agent" };
  }
  res.json(result);
// ...existing code...

// Memory sync endpoint
app.post("/api/sync-memory", async (req, res) => {
  const { data } = req.body;
  await syncMemory(data);
  res.json({ status: "ok" });
});


// Mobile operation endpoint
app.post("/api/mobile", async (req, res) => {
  const { action, payload } = req.body;
  log(`Mobile trigger: action=${action}, payload=${JSON.stringify(payload)}`);
  res.json({ status: "ok", action, received: true });
});

// Health check
app.get("/api/health", (req, res) => {
  log("Health check");
  res.json({ status: "ok", uptime: process.uptime() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SmartRouter running on port ${PORT}`);
});
