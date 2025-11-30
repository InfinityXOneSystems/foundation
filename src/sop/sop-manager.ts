// src/sop/sop-manager.ts
// SOP System: CRUD/versioned Standard Operating Procedures management.

import fs from "fs";
import path from "path";

const SOP_DIR = path.join(__dirname, "../../docs/ops/sop");

// SOP type definition
interface SOP {
  id: string;
  title: string;
  content: string;
  version: number;
  updated: string;
}

export function listSOPs(): SOP[] {
  if (!fs.existsSync(SOP_DIR)) return [];
  return fs.readdirSync(SOP_DIR)
    .filter(f => f.endsWith(".md"))
    .map(f => {
      const content = fs.readFileSync(path.join(SOP_DIR, f), "utf-8");
      const [titleLine, ...body] = content.split("\n");
      return {
        id: f.replace(".md", ""),
        title: (titleLine || "").replace("# ", ""),
        content: body.join("\n"),
        version: 1, // For simplicity, versioning is static here
        updated: fs.statSync(path.join(SOP_DIR, f)).mtime.toISOString(),
      };
    });
}

export function getSOP(id: string): SOP | null {
  const file = path.join(SOP_DIR, `${id}.md`);
  if (!fs.existsSync(file)) return null;
  const content = fs.readFileSync(file, "utf-8");
  const [titleLine, ...body] = content.split("\n");
  return {
    id,
    title: (titleLine || "").replace("# ", ""),
    content: body.join("\n"),
    version: 1,
    updated: fs.statSync(file).mtime.toISOString(),
  };
}

export function saveSOP(sop: SOP) {
  const file = path.join(SOP_DIR, `${sop.id}.md`);
  fs.writeFileSync(file, `# ${sop.title}\n${sop.content}`);
}
