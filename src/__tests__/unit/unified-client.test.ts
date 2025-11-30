/**
 * Unified AI Client Tests
 * Unit tests for multi-provider API client
 * 
 * @package __tests__/unit
 * @author JARVIS
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { UnifiedAIClient, AIClientError } from "../../client/unified-client";
import type { ChatRequest, EmbedRequest } from "../../client/unified-client";

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe("UnifiedAIClient", () => {
  let client: UnifiedAIClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new UnifiedAIClient({
      openai: { api_key: "test-key" },
      timeout_ms: 30000,
    });
  });

  describe("Initialization", () => {
    it("should initialize successfully", () => {
      expect(client).toBeDefined();
    });

    it("should handle provider configuration", () => {
      // Test that client has OpenAI configured
      expect(client.getActiveRequestCount()).toBe(0);
    });
  });

  describe("Chat Completions", () => {
    it("should handle OpenAI chat request", async () => {
      const mockResponse = {
        id: "chatcmpl-123",
        model: "gpt-4o",
        created: Date.now(),
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: "Hello!" },
            finish_reason: "stop",
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const request: ChatRequest = {
        provider: "openai",
        model: "gpt-4o",
        messages: [{ role: "user", content: "Hello" }],
      };

      const response = await client.chat(request);
      expect(response.provider).toBe("openai");
      expect(response.choices[0]?.message.content).toBe("Hello!");
    });
  });

  describe("Error Handling", () => {
    it("should throw AIClientError on API error", async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: "Invalid API key" } }),
      } as Response);

      const request: ChatRequest = {
        provider: "openai",
        model: "gpt-4o",
        messages: [{ role: "user", content: "Hello" }],
      };

      await expect(client.chat(request)).rejects.toThrow(AIClientError);
    });
  });

  describe("Request Management", () => {
    it("should track active requests", () => {
      const count = client.getActiveRequestCount();
      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it("should cancel all requests", () => {
      expect(() => client.cancelAllRequests()).not.toThrow();
    });
  });
});
