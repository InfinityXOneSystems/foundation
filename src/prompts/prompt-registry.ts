import { promises as fs } from "fs";
import * as path from "path";

/**
 * Metadata for a single master prompt stored in the 'prompts' repository.
 */
export interface PromptMeta {
  id: string;
  slug: string;
  file: string; // Path relative to PROMPTS_ROOT
  category: "system" | "personal" | "business" | string;
  scope: string[]; // e.g., ["ingestion", "knowledge"]
  defaultModel?: string; // e.g., "groq-mixtral-8x7b"
  fallbackModel?: string; // e.g., "gpt-4o"
  description?: string;
}

/**
 * The structure of the master index file (prompt-registry.json).
 */
export interface PromptRegistry {
  version: number;
  prompts: PromptMeta[];
}

// PROMPTS_ROOT is set by the Docker environment to where the prompts repo is mounted.
const PROMPTS_ROOT =
  process.env.PROMPTS_ROOT || path.resolve(process.cwd(), "..", "prompts");

let registryCache: PromptRegistry | null = null;

/**
 * Loads the main prompt registry manifest from the mounted prompts repository.
 * Implements a simple memory cache to avoid redundant disk I/O.
 */
export async function loadPromptRegistry(): Promise<PromptRegistry> {
  if (registryCache) return registryCache;
  try {
    const registryPath = path.join(
      PROMPTS_ROOT,
      "index",
      "prompt-registry.json"
    );
    console.log(`Loading Prompt Registry from: ${registryPath}`);
    const raw = await fs.readFile(registryPath, "utf8");
    registryCache = JSON.parse(raw) as PromptRegistry;
    console.log(
      `Loaded registry version ${registryCache.version} with ${registryCache.prompts.length} prompts.`
    );
    return registryCache;
  } catch (error) {
    console.error(
      `ERROR: Failed to load prompt registry from ${PROMPTS_ROOT}. Is the prompts repo mounted correctly?`,
      error
    );
    throw new Error("Prompt registry initialization failed.");
  }
}

/**
 * Retrieves the metadata for a specific prompt ID.
 * @param id The ID (e.g., 'AUTO_PARSE_COMPILE').
 */
export async function getPromptMeta(
  id: string
): Promise<PromptMeta | undefined> {
  const registry = await loadPromptRegistry();
  return registry.prompts.find((p) => p.id === id);
}

/**
 * Loads the full text content of a master prompt file.
 * @param id The ID of the prompt.
 */
export async function loadPromptText(id: string): Promise<string> {
  const meta = await getPromptMeta(id);
  if (!meta) {
    throw new Error(`Prompt ${id} not found in registry.`);
  }
  const filePath = path.join(PROMPTS_ROOT, meta.file);
  try {
    return fs.readFile(filePath, "utf8");
  } catch (error) {
    console.error(
      `ERROR: Could not load prompt text from file path: ${filePath}`,
      error
    );
    throw new Error(`Prompt file access error for ID: ${id}`);
  }
}
