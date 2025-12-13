/**
 * Google Gemini API Validator
 * Validates Google AI API keys for Gemini models
 */

import { ValidationResult, ServiceValidator, maskCredential, createValidationResult } from './types';

export class GeminiValidator implements ServiceValidator {
  name = 'Gemini';

  async validate(apiKey: string): Promise<ValidationResult> {
    if (!apiKey) {
      return createValidationResult(
        this.name,
        'GOOGLE_AI_API_KEY',
        false,
        'Google AI API key is not set',
        'Set GOOGLE_AI_API_KEY with a valid API key from https://makersuite.google.com/app/apikey'
      );
    }

    try {
      // Test API key with models list endpoint
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );

      if (response.ok) {
        const data = await response.json();
        const models = data.models?.map((m: any) => m.name) || [];
        
        return createValidationResult(
          this.name,
          'GOOGLE_AI_API_KEY',
          true,
          'Valid Google AI API key',
          undefined,
          {
            models_available: models.length,
            sample_models: models.slice(0, 3),
            key_preview: maskCredential(apiKey),
          }
        );
      } else if (response.status === 400) {
        return createValidationResult(
          this.name,
          'GOOGLE_AI_API_KEY',
          false,
          'Invalid Google AI API key',
          'Check your API key at https://makersuite.google.com/app/apikey',
          { status: response.status, key_preview: maskCredential(apiKey) }
        );
      } else {
        const errorText = await response.text();
        return createValidationResult(
          this.name,
          'GOOGLE_AI_API_KEY',
          false,
          `Google AI API error: ${response.status}`,
          'Check API status and quotas',
          { status: response.status, error: errorText, key_preview: maskCredential(apiKey) }
        );
      }
    } catch (error: any) {
      return createValidationResult(
        this.name,
        'GOOGLE_AI_API_KEY',
        false,
        `Failed to validate Google AI API: ${error.message}`,
        'Check network connectivity',
        { error: error.message }
      );
    }
  }
}
