import { loadPromptText, getPromptMeta } from "./prompt-registry";
// Placeholder for the Unified AI Client, assumed to handle Groq, OpenAI, etc.
import {
  unifiedClient,
  ChatResponse,
  ChatOptions,
} from "../providers/unified-client";

interface RunPromptOptions {
  id: string;
  userInput: string | object;
  systemOverrides?: string; // Optional extra system-instructions
}

/**
 * Executes a system prompt by loading its definition and routing the request
 * to the appropriate LLM based on the prompt's configuration (Groq primary, OpenAI fallback).
 * @param options - Contains the prompt ID, user input, and optional overrides.
 * @returns The response from the LLM chat completion.
 */
export async function runSystemPrompt({
  id,
  userInput,
  systemOverrides,
}: RunPromptOptions): Promise<ChatResponse> {
  const meta = await getPromptMeta(id);
  if (!meta) throw new Error(`Prompt ${id} not registered in the system.`);

  const baseSystemPrompt = await loadPromptText(id);

  // Combine base prompt with any runtime overrides
  const systemPrompt =
    systemOverrides && systemOverrides.trim().length > 0
      ? `${baseSystemPrompt}\n\n---\nADDITIONAL SYSTEM INSTRUCTIONS:\n${systemOverrides}`
      : baseSystemPrompt;

  // Use the model defined in the registry, defaulting to a fast Groq model if undefined
  const model = meta.defaultModel ?? "groq-mixtral-8x7b";

  // Determine provider for the Unified Client based on model name prefix
  const provider = model.startsWith("gpt-")
    ? "openai"
    : model.startsWith("claude-")
    ? "anthropic"
    : model.startsWith("groq-")
    ? "groq"
    : "default";

  const chatOptions: ChatOptions = {
    provider,
    model,
    system: systemPrompt,
    // Convert object input to JSON string as standard practice for structured prompts
    user:
      typeof userInput === "string"
        ? userInput
        : JSON.stringify(userInput, null, 2),
  };

  try {
    console.log(`Executing prompt [${id}] with model: ${model} (${provider})`);
    const response = await unifiedClient.chat(chatOptions);
    return response;
  } catch (e) {
    console.warn(
      `Primary model (${model}) failed for prompt [${id}]. Attempting fallback...`
    );

    const fallbackModel = meta.fallbackModel;
    if (fallbackModel) {
      const fallbackProvider = fallbackModel.startsWith("gpt-")
        ? "openai"
        : fallbackModel.startsWith("claude-")
        ? "anthropic"
        : fallbackModel.startsWith("groq-")
        ? "groq"
        : "default";

      chatOptions.model = fallbackModel;
      chatOptions.provider = fallbackProvider;

      console.log(
        `Executing fallback prompt [${id}] with model: ${fallbackModel} (${fallbackProvider})`
      );
      return unifiedClient.chat(chatOptions);
    }

    console.error(
      `Fallback failed or not defined for prompt [${id}]. Aborting.`
    );
    throw e;
  }
}
