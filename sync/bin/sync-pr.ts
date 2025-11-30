#!/usr/bin/env tsx
import fs from "fs";
import path from "path";

type Config = {
  source: string;
  targets: string[];
  strategy: { mode: string; conflicts: string; filters: { include: string[]; exclude: string[] } };
};

async function main() {
  const cfgPath = path.resolve(process.cwd(), "sync/repo-sync.config.json");
  const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf-8")) as Config;
  console.log("Dry-run: would open PRs from", cfg.source, "to", cfg.targets.join(", "));
  console.log("Strategy:", cfg.strategy);
  console.log("NOTE: Auth with GitHub App tokens will be required to execute.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
