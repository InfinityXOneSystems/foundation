// orchestrator.ts
// Infinity X Automation Orchestrator (v2) — main entrypoint

import { ingest } from "./modules/ingest";
import { index } from "./modules/index";
import { reason } from "./modules/reason";
import { execute } from "./modules/execute";
import { sync } from "./modules/sync";
import { audit } from "./modules/audit";

async function main() {
  audit.log({ actor: "system", intent: "startup", outcome: "initiated", timestamp: new Date().toISOString() });
  await sync();
  while (true) {
    try {
      await ingest();
      await index();
      await reason();
      await execute();
      await sync();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      audit.log({ actor: "system", intent: "loop-error", outcome: message, timestamp: new Date().toISOString() });
    }
    await new Promise(r => setTimeout(r, Number(process.env.LOOP_CYCLE_INTERVAL) || 60000));
  }
}

main();
