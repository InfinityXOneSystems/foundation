import { runSystemPrompt } from "../prompts/prompt-runner";

/**
 * Defines the structure of raw input data sent to the parser.
 */
export interface RawSourceInput {
  rawText: string;
  sourceType: "chat" | "web_page" | "doc" | "transcript" | "log";
  meta?: Record<string, unknown>;
}

/**
 * Runs the critical AUTO_PARSE_COMPILE master prompt to normalize, compile,
 * and extract structured data (problems, tasks, entities) from raw text.
 * @param input - The raw source text and metadata.
 * @returns The parsed and compiled JSON structure (response from the LLM).
 */
export async function parseAndCompileSource(input: RawSourceInput) {
  // The master prompt (AUTO_PARSE_COMPILE) is designed to handle this structured input
  const result = await runSystemPrompt({
    id: "AUTO_PARSE_COMPILE",
    userInput: input,
  });

  // The result is expected to be a JSON-like payload in the LLM's response.
  return result;
}
