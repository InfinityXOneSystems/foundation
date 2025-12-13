/**
 * Groq API Validator
 * Validates Groq API keys for fast inference
 */

import { ValidationResult, ServiceValidator, maskCredential, createValidationResult } from './types.js';

export class GroqValidator implements ServiceValidator {
  name = 'Groq';

  async validate(apiKey: string): Promise<ValidationResult> {
    if (!apiKey) {
      return createValidationResult(
        this.name,
        'GROQ_API_KEY',
        false,
        'Groq API key is not set',
        'Set GROQ_API_KEY with a valid API key from https://console.groq.com/keys'
      );
    }

    try {
      // Test API key with models list endpoint
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const models = data.data?.map((m: any) => m.id) || [];
        
        return createValidationResult(
          this.name,
          'GROQ_API_KEY',
          true,
          'Valid Groq API key',
          undefined,
          {
            models_available: models.length,
            sample_models: models.slice(0, 5),
            key_preview: maskCredential(apiKey),
          }
        );
      } else if (response.status === 401) {
        return createValidationResult(
          this.name,
          'GROQ_API_KEY',
          false,
          'Invalid Groq API key',
          'Check your API key at https://console.groq.com/keys',
          { status: response.status, key_preview: maskCredential(apiKey) }
        );
      } else if (response.status === 429) {
        return createValidationResult(
          this.name,
          'GROQ_API_KEY',
          true,
          'Valid API key but rate limited',
          'Reduce API usage or wait before retrying',
          { status: response.status, key_preview: maskCredential(apiKey) }
        );
      } else {
        const errorText = await response.text();
        return createValidationResult(
          this.name,
          'GROQ_API_KEY',
          false,
          `Groq API error: ${response.status}`,
          'Check API status',
          { status: response.status, error: errorText, key_preview: maskCredential(apiKey) }
        );
      }
    } catch (error: any) {
      return createValidationResult(
        this.name,
        'GROQ_API_KEY',
        false,
        `Failed to validate Groq API: ${error.message}`,
        'Check network connectivity',
        { error: error.message }
      );
    }
  }
}
