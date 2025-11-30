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

function load(file) {
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}
function save(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

export function pruneMemory({ maxItems = 1000, minTTL = 3600 } = {}) {
  let memory = load(MEMORY);
  const nowEpoch = Date.now() / 1000;
  // TTL prune
  const keep = memory.filter(item => {
    if (item.ttl && (nowEpoch - Date.parse(item.updated)/1000) > item.ttl) return false;
    return true;
  });
  // LRU prune
  if (keep.length > maxItems) {
    keep.sort((a, b) => (b.lru || 0) - (a.lru || 0));
    const toArchive = keep.splice(maxItems);
    archiveItems(toArchive);
  }
  save(MEMORY, keep);
}

export function pruneVectors({ maxItems = 1000 } = {}) {
  let vectors = load(VECTORS);
  if (vectors.length > maxItems) {
    const toArchive = vectors.splice(maxItems);
    archiveItems(toArchive, "vectors");
  }
  save(VECTORS, vectors);
}

export function pruneSemantic({ minRelevance = 0.1 } = {}) {
  let semantic = load(SEMANTIC);
  // For demo, just keep all
  save(SEMANTIC, semantic);
}

function archiveItems(items, type = "memory") {
  if (!fs.existsSync(ARCHIVE)) fs.mkdirSync(ARCHIVE);
  const file = path.join(ARCHIVE, `${type}-archive-${now()}.json`);
  fs.writeFileSync(file, JSON.stringify(items, null, 2));
}

export function rotateMemory() {
  pruneMemory();
  pruneVectors();
  pruneSemantic();
}
