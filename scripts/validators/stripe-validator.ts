/**
 * Stripe API Validator
 * Validates Stripe API keys
 */

import { ValidationResult, ServiceValidator, maskCredential, createValidationResult } from './types';

export class StripeValidator implements ServiceValidator {
  name = 'Stripe';

  async validate(apiKey: string): Promise<ValidationResult> {
    if (!apiKey) {
      return createValidationResult(
        this.name,
        'STRIPE_API_KEY',
        false,
        'Stripe API key is not set',
        'Set STRIPE_API_KEY with a valid key from https://dashboard.stripe.com/apikeys'
      );
    }

    // Detect test vs production key
    const isTestKey = apiKey.startsWith('sk_test_');
    const isProdKey = apiKey.startsWith('sk_live_');

    if (!isTestKey && !isProdKey) {
      return createValidationResult(
        this.name,
        'STRIPE_API_KEY',
        false,
        'Invalid Stripe API key format',
        'Key should start with sk_test_ or sk_live_',
        { key_preview: maskCredential(apiKey) }
      );
    }

    try {
      // Test API key by retrieving account info
      const response = await fetch('https://api.stripe.com/v1/account', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return createValidationResult(
          this.name,
          'STRIPE_API_KEY',
          true,
          `Valid Stripe API key (${isTestKey ? 'test mode' : 'production mode'})`,
          isTestKey ? undefined : 'WARNING: Using production Stripe key',
          {
            mode: isTestKey ? 'test' : 'production',
            account_id: data.id,
            country: data.country,
            key_preview: maskCredential(apiKey),
          }
        );
      } else if (response.status === 401) {
        return createValidationResult(
          this.name,
          'STRIPE_API_KEY',
          false,
          'Invalid Stripe API key',
          'Check your API key at https://dashboard.stripe.com/apikeys',
          { status: response.status, key_preview: maskCredential(apiKey) }
        );
      } else {
        const errorText = await response.text();
        return createValidationResult(
          this.name,
          'STRIPE_API_KEY',
          false,
          `Stripe API error: ${response.status}`,
          'Check API status at https://status.stripe.com/',
          { status: response.status, error: errorText, key_preview: maskCredential(apiKey) }
        );
      }
    } catch (error: any) {
      return createValidationResult(
        this.name,
        'STRIPE_API_KEY',
        false,
        `Failed to validate Stripe API: ${error.message}`,
        'Check network connectivity',
        { error: error.message }
      );
    }
  }
}
