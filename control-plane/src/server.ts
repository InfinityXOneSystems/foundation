import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createAppJWT, exchangeInstallationToken } from "./github";

// Simple metrics
let totalCommands = 0;
let totalJobsQueried = 0;

// Basic JWT header auth (optional)
function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const required = process.env.REQUIRE_AUTH === "true";
  if (!required) return next();
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "unauthorized" });
  // NOTE: In production, verify JWT using a secret/public key
  // Here we only check presence
  return next();
}

type Job = { id: string; status: "pending" | "running" | "completed" | "failed"; createdAt: string };
const jobs = new Map<string, Job>();

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(authMiddleware);

app.get("/healthz", (_req, res) => res.json({ ok: true }));

app.get("/metrics", (_req, res) => {
  res.type("text/plain").send(
    `ixone_total_commands ${totalCommands}\n` +
    `ixone_total_jobs_queried ${totalJobsQueried}\n`
  );
});

// Protected GitHub token test endpoint (uses env placeholders)
app.get("/v1/github/test", async (_req, res) => {
  try {
    const appId = process.env.GITHUB_APP_ID || "";
    const keyPath = process.env.GITHUB_APP_PRIVATE_KEY_PATH || "";
    const instId = process.env.GITHUB_APP_INSTALLATION_ID || "";
    if (!appId || !keyPath || !instId) return res.status(400).json({ error: "missing_env" });
    const jwt = createAppJWT(appId, keyPath);
    const token = await exchangeInstallationToken(jwt, instId);
    res.json({ ok: true, tokenPreview: token.substring(0, 10) + "..." });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.post("/v1/commands", (req, res) => {
  const id = `job_${Date.now()}`;
  const job: Job = { id, status: "pending", createdAt: new Date().toISOString() };
  jobs.set(id, job);
  // In future: enqueue work to orchestrator/worker via queue
  totalCommands++;
  res.status(202).json({ id, status: job.status });
});

app.get("/v1/jobs/:id", (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: "not_found" });
  totalJobsQueried++;
  res.json(job);
});

const port = Number(process.env.PORT || 8080);
app.listen(port, () => {
  console.log(`Control plane listening on :${port}`);
});
