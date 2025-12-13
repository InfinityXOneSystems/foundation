/**
 * SendGrid API Validator
 * Validates SendGrid API keys
 */

import { ValidationResult, ServiceValidator, maskCredential, createValidationResult } from './types.js';

export class SendGridValidator implements ServiceValidator {
  name = 'SendGrid';

  async validate(apiKey: string): Promise<ValidationResult> {
    if (!apiKey) {
      return createValidationResult(
        this.name,
        'SENDGRID_API_KEY',
        false,
        'SendGrid API key is not set',
        'Set SENDGRID_API_KEY with a valid key from https://app.sendgrid.com/settings/api_keys'
      );
    }

    if (!apiKey.startsWith('SG.')) {
      return createValidationResult(
        this.name,
        'SENDGRID_API_KEY',
        false,
        'Invalid SendGrid API key format',
        'API key should start with SG.',
        { key_preview: maskCredential(apiKey) }
      );
    }

    try {
      // Test API key with a simple GET request
      const response = await fetch('https://api.sendgrid.com/v3/scopes', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const scopes = data.scopes || [];
        
        return createValidationResult(
          this.name,
          'SENDGRID_API_KEY',
          true,
          'Valid SendGrid API key',
          undefined,
          {
            scopes_count: scopes.length,
            has_mail_send: scopes.includes('mail.send'),
            key_preview: maskCredential(apiKey),
          }
        );
      } else if (response.status === 401 || response.status === 403) {
        return createValidationResult(
          this.name,
          'SENDGRID_API_KEY',
          false,
          'Invalid SendGrid API key',
          'Check your API key at https://app.sendgrid.com/settings/api_keys',
          { status: response.status, key_preview: maskCredential(apiKey) }
        );
      } else {
        const errorText = await response.text();
        return createValidationResult(
          this.name,
          'SENDGRID_API_KEY',
          false,
          `SendGrid API error: ${response.status}`,
          'Check API status at https://status.sendgrid.com/',
          { status: response.status, error: errorText, key_preview: maskCredential(apiKey) }
        );
      }
    } catch (error: any) {
      return createValidationResult(
        this.name,
        'SENDGRID_API_KEY',
        false,
        `Failed to validate SendGrid API: ${error.message}`,
        'Check network connectivity',
        { error: error.message }
      );
    }
  }
}
