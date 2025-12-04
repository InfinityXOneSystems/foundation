import { runSystemPrompt } from "../prompts/prompt-runner";

/**
 * Defines the context required for the strategist agent.
 */
export interface StrategyContext {
  mode: "personal" | "business" | "system" | "combined";
  // Contains contextual answers, goals, and system data pulled from the VDB/Workspace
  contextData: Record<string, unknown>;
}

/**
 * Runs the high-level AUTO_STRATEGIST master prompt to generate plans, roadmaps,
 * and strategic decisions based on the current context and goals.
 * @param ctx - The strategy context (mode, gathered data).
 * @returns The full strategic brief (response from the LLM, typically Markdown/JSON).
 */
export async function generateStrategy(ctx: StrategyContext) {
  const response = await runSystemPrompt({
    id: "AUTO_STRATEGIST",
    userInput: ctx,
  });

  // The response includes the strategic output: snapshot, themes, plans, etc.
  return response;
}
