/**
 * Anthropic API Validator
 * Validates Anthropic API keys for Claude models
 */

import { ValidationResult, ServiceValidator, maskCredential, createValidationResult } from './types.js';

export class AnthropicValidator implements ServiceValidator {
  name = 'Anthropic';

  async validate(apiKey: string): Promise<ValidationResult> {
    if (!apiKey) {
      return createValidationResult(
        this.name,
        'ANTHROPIC_API_KEY',
        false,
        'Anthropic API key is not set',
        'Set ANTHROPIC_API_KEY with a valid API key from https://console.anthropic.com/'
      );
    }

    try {
      // Test API key with a simple completion request
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 10,
          messages: [
            {
              role: 'user',
              content: 'test',
            },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return createValidationResult(
          this.name,
          'ANTHROPIC_API_KEY',
          true,
          'Valid Anthropic API key',
          undefined,
          {
            model_tested: 'claude-3-5-sonnet-20241022',
            key_preview: maskCredential(apiKey),
          }
        );
      } else if (response.status === 401) {
        return createValidationResult(
          this.name,
          'ANTHROPIC_API_KEY',
          false,
          'Invalid Anthropic API key',
          'Check your API key at https://console.anthropic.com/',
          { status: response.status, key_preview: maskCredential(apiKey) }
        );
      } else if (response.status === 429) {
        return createValidationResult(
          this.name,
          'ANTHROPIC_API_KEY',
          true,
          'Valid API key but rate limited',
          'Reduce API usage or upgrade your plan',
          { status: response.status, key_preview: maskCredential(apiKey) }
        );
      } else {
        const errorText = await response.text();
        return createValidationResult(
          this.name,
          'ANTHROPIC_API_KEY',
          false,
          `Anthropic API error: ${response.status}`,
          'Check API status at https://status.anthropic.com/',
          { status: response.status, error: errorText, key_preview: maskCredential(apiKey) }
        );
      }
    } catch (error: any) {
      return createValidationResult(
        this.name,
        'ANTHROPIC_API_KEY',
        false,
        `Failed to validate Anthropic API: ${error.message}`,
        'Check network connectivity and API status',
        { error: error.message }
      );
    }
  }
}
