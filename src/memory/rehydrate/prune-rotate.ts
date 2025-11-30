// rehydrate/prune-rotate.ts
// Prune and rotation system for persistent, semantic, and vector memory
import fs from "fs";
import path from "path";

const REHYDRATE = path.join(__dirname);
const MEMORY = path.join(REHYDRATE, "memory.json");
const VECTORS = path.join(REHYDRATE, "vectors.json");
const SEMANTIC = path.join(REHYDRATE, "semantic.json");
const ARCHIVE = path.join(REHYDRATE, "archive");

function now() { return new Date().toISOString(); }

function load(file: string): unknown[] {
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}
function save(file: string, data: unknown): void {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

export function pruneMemory({ maxItems = 1000, _minTTL = 3600 } = {}) {
  let memory = load(MEMORY) as unknown[];
  const nowEpoch = Date.now() / 1000;
  // TTL prune
  const keep = memory.filter((item: unknown) => {
    const m = item as Record<string, unknown>;
    if (m.ttl && (nowEpoch - Date.parse(m.updated as string)/1000) > (m.ttl as number)) return false;
    return true;
  });
  // LRU prune
  if (keep.length > maxItems) {
    keep.sort((a: unknown, b: unknown) => {
      const ma = a as Record<string, unknown>;
      const mb = b as Record<string, unknown>;
      return (mb.lru as number || 0) - (ma.lru as number || 0);
    });
    const toArchive = keep.splice(maxItems);
    archiveItems(toArchive);
  }
  save(MEMORY, keep);
}

export function pruneVectors({ maxItems = 1000 } = {}) {
  let vectors = load(VECTORS) as unknown[];
  if (vectors.length > maxItems) {
    const toArchive = vectors.splice(maxItems);
    archiveItems(toArchive, "vectors");
  }
  save(VECTORS, vectors);
}

export function pruneSemantic({ _minRelevance = 0.1 } = {}) {
  let semantic = load(SEMANTIC) as unknown[];
  // For demo, just keep all (relevance filtering not yet implemented)
  save(SEMANTIC, semantic);
}

function archiveItems(items: unknown, type = "memory"): void {
  if (!fs.existsSync(ARCHIVE)) fs.mkdirSync(ARCHIVE);
  const file = path.join(ARCHIVE, `${type}-archive-${now()}.json`);
  fs.writeFileSync(file, JSON.stringify(items, null, 2));
}

export function rotateMemory() {
  pruneMemory();
  pruneVectors();
  pruneSemantic();
}
