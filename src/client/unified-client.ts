/**
 * Unified AI Client
 * Runtime API execution layer for all providers with retry logic and error handling
 * 
 * @package client
 * @author JARVIS
 * @version 1.0.0
 */

import { EventEmitter } from "events";
import type { ProviderName } from "../taxonomy/enterprise-taxonomy";

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export type MessageRole = "system" | "user" | "assistant" | "tool" | "function";
export type FinishReason = "stop" | "length" | "content_filter" | "tool_calls" | "function_call";

/**
 * Unified chat message
 */
export interface ChatMessage {
  role: MessageRole;
  content: string | Array<{ type: string; text?: string; image_url?: string }>;
  name?: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  function_call?: { name: string; arguments: string };
}

/**
 * Tool call definition
 */
export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

/**
 * Function/Tool definition
 */
export interface FunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Unified chat request
 */
export interface ChatRequest {
  provider: ProviderName;
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string | string[];
  stream?: boolean;
  tools?: FunctionDefinition[];
  tool_choice?: "none" | "auto" | "required" | { type: "function"; function: { name: string } };
  response_format?: { type: "text" | "json_object" };
  seed?: number;
  user?: string;
}

/**
 * Unified chat response
 */
export interface ChatResponse {
  id: string;
  provider: ProviderName;
  model: string;
  created: number;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: FinishReason;
    logprobs?: unknown;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  system_fingerprint?: string;
}

/**
 * Unified embedding request
 */
export interface EmbedRequest {
  provider: ProviderName;
  model: string;
  input: string | string[];
  encoding_format?: "float" | "base64";
  dimensions?: number;
  user?: string;
}

/**
 * Unified embedding response
 */
export interface EmbedResponse {
  provider: ProviderName;
  model: string;
  data: Array<{
    index: number;
    embedding: number[];
    object: "embedding";
  }>;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  max_retries: number;
  initial_delay_ms: number;
  max_delay_ms: number;
  backoff_multiplier: number;
  retry_on_status_codes: number[];
}

/**
 * Client configuration
 */
export interface ClientConfig {
  openai?: {
    api_key: string;
    base_url?: string;
    organization?: string;
  };
  anthropic?: {
    api_key: string;
    base_url?: string;
  };
  groq?: {
    api_key: string;
    base_url?: string;
  };
  google?: {
    api_key: string;
    base_url?: string;
  };
  azure?: {
    api_key: string;
    endpoint: string;
    deployment_name?: string;
  };
  retry?: RetryConfig;
  timeout_ms?: number;
  max_concurrent_requests?: number;
}

/**
 * API Error
 */
export class AIClientError extends Error {
  constructor(
    message: string,
    public provider: ProviderName,
    public status_code?: number,
    public error_type?: string,
    public raw_error?: unknown
  ) {
    super(message);
    this.name = "AIClientError";
  }
}

// ============================================================
// UNIFIED AI CLIENT
// ============================================================

/**
 * Unified AI Client
 * Provides consistent API across all providers
 */
export class UnifiedAIClient extends EventEmitter {
  private config: ClientConfig;
  private retry_config: RetryConfig;
  private active_requests: Map<string, AbortController> = new Map();

  constructor(config: ClientConfig) {
    super();
    this.config = config;
    this.retry_config = config.retry || {
      max_retries: 3,
      initial_delay_ms: 1000,
      max_delay_ms: 10000,
      backoff_multiplier: 2,
      retry_on_status_codes: [429, 500, 502, 503, 504],
    };
  }

  /**
   * Chat completion with unified interface
   */
  public async chat(request: ChatRequest): Promise<ChatResponse> {
    this.emit("request:start", { provider: request.provider, model: request.model });

    try {
      const response = await this.executeWithRetry(() => this.executeChatRequest(request));
      this.emit("request:success", { provider: request.provider, model: request.model });
      return response;
    } catch (error) {
      this.emit("request:error", { provider: request.provider, error });
      throw error;
    }
  }

  /**
   * Execute chat request for specific provider
   */
  private async executeChatRequest(request: ChatRequest): Promise<ChatResponse> {
    switch (request.provider) {
      case "openai":
        return this.executeOpenAIChat(request);
      case "anthropic":
        return this.executeAnthropicChat(request);
      case "groq":
        return this.executeGroqChat(request);
      case "google":
        return this.executeGoogleChat(request);
      case "azure":
        return this.executeAzureChat(request);
      default:
        throw new AIClientError(
          `Unsupported provider: ${request.provider}`,
          request.provider
        );
    }
  }

  /**
   * OpenAI chat implementation
   */
  private async executeOpenAIChat(request: ChatRequest): Promise<ChatResponse> {
    const config = this.config.openai;
    if (!config?.api_key) {
      throw new AIClientError("OpenAI API key not configured", "openai");
    }

    const url = `${config.base_url || "https://api.openai.com"}/v1/chat/completions`;
    const headers = {
      "Authorization": `Bearer ${config.api_key}`,
      "Content-Type": "application/json",
      ...(config.organization && { "OpenAI-Organization": config.organization }),
    };

    const body = {
      model: request.model,
      messages: request.messages,
      temperature: request.temperature,
      max_tokens: request.max_tokens,
      top_p: request.top_p,
      frequency_penalty: request.frequency_penalty,
      presence_penalty: request.presence_penalty,
      stop: request.stop,
      stream: request.stream || false,
      tools: request.tools,
      tool_choice: request.tool_choice,
      response_format: request.response_format,
      seed: request.seed,
      user: request.user,
    };

    const response = await this.fetchWithTimeout(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new AIClientError(
        error.error?.message || "OpenAI request failed",
        "openai",
        response.status,
        error.error?.type,
        error
      );
    }

    const data = await response.json();
    return {
      ...data,
      provider: "openai",
    };
  }

  /**
   * Anthropic chat implementation
   */
  private async executeAnthropicChat(request: ChatRequest): Promise<ChatResponse> {
    const config = this.config.anthropic;
    if (!config?.api_key) {
      throw new AIClientError("Anthropic API key not configured", "anthropic");
    }

    const url = `${config.base_url || "https://api.anthropic.com"}/v1/messages`;
    const headers = {
      "x-api-key": config.api_key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    };

    // Extract system message
    const system_message = request.messages.find((m) => m.role === "system");
    const messages = request.messages.filter((m) => m.role !== "system");

    const body = {
      model: request.model,
      max_tokens: request.max_tokens || 4096,
      messages: messages,
      ...(system_message && { system: system_message.content }),
      temperature: request.temperature,
      top_p: request.top_p,
      stop_sequences: Array.isArray(request.stop) ? request.stop : request.stop ? [request.stop] : undefined,
      stream: request.stream || false,
      tools: request.tools,
    };

    const response = await this.fetchWithTimeout(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new AIClientError(
        error.error?.message || "Anthropic request failed",
        "anthropic",
        response.status,
        error.error?.type,
        error
      );
    }

    const data = await response.json();

    // Convert Anthropic response to unified format
    return {
      id: data.id,
      provider: "anthropic",
      model: data.model,
      created: Math.floor(Date.now() / 1000),
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: data.content[0]?.text || "",
          },
          finish_reason: data.stop_reason === "end_turn" ? "stop" : data.stop_reason,
        },
      ],
      usage: {
        prompt_tokens: data.usage.input_tokens,
        completion_tokens: data.usage.output_tokens,
        total_tokens: data.usage.input_tokens + data.usage.output_tokens,
      },
    };
  }

  /**
   * Groq chat implementation
   */
  private async executeGroqChat(request: ChatRequest): Promise<ChatResponse> {
    const config = this.config.groq;
    if (!config?.api_key) {
      throw new AIClientError("Groq API key not configured", "groq");
    }

    const url = `${config.base_url || "https://api.groq.com"}/openai/v1/chat/completions`;
    const headers = {
      "Authorization": `Bearer ${config.api_key}`,
      "Content-Type": "application/json",
    };

    const body = {
      model: request.model,
      messages: request.messages,
      temperature: request.temperature,
      max_tokens: request.max_tokens,
      top_p: request.top_p,
      stop: request.stop,
      stream: request.stream || false,
      user: request.user,
    };

    const response = await this.fetchWithTimeout(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new AIClientError(
        error.error?.message || "Groq request failed",
        "groq",
        response.status,
        error.error?.type,
        error
      );
    }

    const data = await response.json();
    return {
      ...data,
      provider: "groq",
    };
  }

  /**
   * Google chat implementation
   */
  private async executeGoogleChat(request: ChatRequest): Promise<ChatResponse> {
    const config = this.config.google;
    if (!config?.api_key) {
      throw new AIClientError("Google API key not configured", "google");
    }

    const url = `${config.base_url || "https://generativelanguage.googleapis.com"}/v1/models/${request.model}:generateContent?key=${config.api_key}`;
    const headers = {
      "Content-Type": "application/json",
    };

    // Convert messages to Google format
    const contents = request.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: typeof m.content === "string" ? m.content : m.content[0]?.text || "" }],
      }));

    const system_instruction = request.messages.find((m) => m.role === "system");

    const body = {
      contents,
      ...(system_instruction && {
        systemInstruction: {
          parts: [{ text: typeof system_instruction.content === "string" ? system_instruction.content : system_instruction.content[0]?.text || "" }],
        },
      }),
      generationConfig: {
        temperature: request.temperature,
        maxOutputTokens: request.max_tokens,
        topP: request.top_p,
        stopSequences: Array.isArray(request.stop) ? request.stop : request.stop ? [request.stop] : undefined,
      },
    };

    const response = await this.fetchWithTimeout(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new AIClientError(
        error.error?.message || "Google request failed",
        "google",
        response.status,
        error.error?.code,
        error
      );
    }

    const data = await response.json();

    // Convert Google response to unified format
    return {
      id: crypto.randomUUID(),
      provider: "google",
      model: request.model,
      created: Math.floor(Date.now() / 1000),
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: data.candidates[0]?.content?.parts[0]?.text || "",
          },
          finish_reason: data.candidates[0]?.finishReason === "STOP" ? "stop" : data.candidates[0]?.finishReason.toLowerCase(),
        },
      ],
      usage: {
        prompt_tokens: data.usageMetadata?.promptTokenCount || 0,
        completion_tokens: data.usageMetadata?.candidatesTokenCount || 0,
        total_tokens: data.usageMetadata?.totalTokenCount || 0,
      },
    };
  }

  /**
   * Azure OpenAI chat implementation
   */
  private async executeAzureChat(request: ChatRequest): Promise<ChatResponse> {
    const config = this.config.azure;
    if (!config?.api_key || !config?.endpoint) {
      throw new AIClientError("Azure configuration incomplete", "azure");
    }

    const deployment = config.deployment_name || request.model;
    const url = `${config.endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-08-01-preview`;
    const headers = {
      "api-key": config.api_key,
      "Content-Type": "application/json",
    };

    const body = {
      messages: request.messages,
      temperature: request.temperature,
      max_tokens: request.max_tokens,
      top_p: request.top_p,
      frequency_penalty: request.frequency_penalty,
      presence_penalty: request.presence_penalty,
      stop: request.stop,
      stream: request.stream || false,
      tools: request.tools,
      tool_choice: request.tool_choice,
      response_format: request.response_format,
      seed: request.seed,
      user: request.user,
    };

    const response = await this.fetchWithTimeout(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new AIClientError(
        error.error?.message || "Azure request failed",
        "azure",
        response.status,
        error.error?.type,
        error
      );
    }

    const data = await response.json();
    return {
      ...data,
      provider: "azure",
    };
  }

  /**
   * Embedding with unified interface
   */
  public async embed(request: EmbedRequest): Promise<EmbedResponse> {
    this.emit("embed:start", { provider: request.provider, model: request.model });

    try {
      const response = await this.executeWithRetry(() => this.executeEmbedRequest(request));
      this.emit("embed:success", { provider: request.provider, model: request.model });
      return response;
    } catch (error) {
      this.emit("embed:error", { provider: request.provider, error });
      throw error;
    }
  }

  /**
   * Execute embedding request for specific provider
   */
  private async executeEmbedRequest(request: EmbedRequest): Promise<EmbedResponse> {
    switch (request.provider) {
      case "openai":
      case "azure":
        return this.executeOpenAIEmbed(request);
      case "google":
        return this.executeGoogleEmbed(request);
      default:
        throw new AIClientError(
          `Embeddings not supported for provider: ${request.provider}`,
          request.provider
        );
    }
  }

  /**
   * OpenAI/Azure embedding implementation
   */
  private async executeOpenAIEmbed(request: EmbedRequest): Promise<EmbedResponse> {
    const config = request.provider === "azure" ? this.config.azure : this.config.openai;
    if (!config?.api_key) {
      throw new AIClientError(`${request.provider} API key not configured`, request.provider);
    }

    let url: string;
    let headers: Record<string, string>;

    if (request.provider === "azure" && "endpoint" in config) {
      const deployment = "deployment_name" in config ? config.deployment_name : request.model;
      url = `${config.endpoint}/openai/deployments/${deployment}/embeddings?api-version=2024-08-01-preview`;
      headers = {
        "api-key": config.api_key,
        "Content-Type": "application/json",
      };
    } else {
      url = `${"base_url" in config && config.base_url ? config.base_url : "https://api.openai.com"}/v1/embeddings`;
      headers = {
        "Authorization": `Bearer ${config.api_key}`,
        "Content-Type": "application/json",
      };
    }

    const body = {
      model: request.model,
      input: request.input,
      encoding_format: request.encoding_format,
      dimensions: request.dimensions,
      user: request.user,
    };

    const response = await this.fetchWithTimeout(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new AIClientError(
        error.error?.message || "Embedding request failed",
        request.provider,
        response.status,
        error.error?.type,
        error
      );
    }

    const data = await response.json();
    return {
      ...data,
      provider: request.provider,
    };
  }

  /**
   * Google embedding implementation
   */
  private async executeGoogleEmbed(request: EmbedRequest): Promise<EmbedResponse> {
    const config = this.config.google;
    if (!config?.api_key) {
      throw new AIClientError("Google API key not configured", "google");
    }

    const inputs = Array.isArray(request.input) ? request.input : [request.input];
    const embeddings: Array<{ index: number; embedding: number[]; object: "embedding" }> = [];
    let total_tokens = 0;

    for (let i = 0; i < inputs.length; i++) {
      const url = `${config.base_url || "https://generativelanguage.googleapis.com"}/v1/models/${request.model}:embedContent?key=${config.api_key}`;
      const headers = {
        "Content-Type": "application/json",
      };

      const body = {
        content: {
          parts: [{ text: inputs[i] }],
        },
      };

      const response = await this.fetchWithTimeout(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new AIClientError(
          error.error?.message || "Google embedding request failed",
          "google",
          response.status,
          error.error?.code,
          error
        );
      }

      const data = await response.json();
      embeddings.push({
        index: i,
        embedding: data.embedding.values,
        object: "embedding",
      });
      const input = inputs[i];
      if (input) {
        total_tokens += input.length / 4; // Rough estimate
      }
    }

    return {
      provider: "google",
      model: request.model,
      data: embeddings,
      usage: {
        prompt_tokens: total_tokens,
        total_tokens,
      },
    };
  }

  /**
   * Execute with retry logic
   */
  private async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let last_error: Error | undefined;
    let delay = this.retry_config.initial_delay_ms;

    for (let attempt = 0; attempt <= this.retry_config.max_retries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        last_error = error as Error;

        if (
          error instanceof AIClientError &&
          error.status_code &&
          !this.retry_config.retry_on_status_codes.includes(error.status_code)
        ) {
          throw error;
        }

        if (attempt < this.retry_config.max_retries) {
          await this.sleep(delay);
          delay = Math.min(delay * this.retry_config.backoff_multiplier, this.retry_config.max_delay_ms);
          this.emit("retry", { attempt: attempt + 1, delay });
        }
      }
    }

    throw last_error;
  }

  /**
   * Fetch with timeout
   */
  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const timeout = this.config.timeout_ms || 60000;
    const controller = new AbortController();
    const request_id = crypto.randomUUID();

    this.active_requests.set(request_id, controller);

    const timeout_id = setTimeout(() => {
      controller.abort();
      this.active_requests.delete(request_id);
    }, timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeout_id);
      this.active_requests.delete(request_id);
      return response;
    } catch (error) {
      clearTimeout(timeout_id);
      this.active_requests.delete(request_id);
      throw error;
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Cancel all active requests
   */
  public cancelAllRequests(): void {
    for (const controller of this.active_requests.values()) {
      controller.abort();
    }
    this.active_requests.clear();
    this.emit("requests:cancelled", { count: this.active_requests.size });
  }

  /**
   * Get active request count
   */
  public getActiveRequestCount(): number {
    return this.active_requests.size;
  }
}
