// auto-orchestrator.js
// Infinity X AUTO ALL Orchestrator — main entrypoint

const { ingest } = require("./modules/ingest");
const { index } = require("./modules/index");
const { reason } = require("./modules/reason");
const { execute } = require("./modules/execute");
const { sync } = require("./modules/sync");
const { audit } = require("./modules/audit");

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
      audit.log({ actor: "system", intent: "loop-error", outcome: err.message, timestamp: new Date().toISOString() });
    }
    await new Promise(r => setTimeout(r, process.env.LOOP_CYCLE_INTERVAL || 60000));
  }
}

main();
