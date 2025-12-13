/**
 * Twilio API Validator
 * Validates Twilio credentials
 */

import { ValidationResult, ServiceValidator, maskCredential, createValidationResult } from './types';

export class TwilioValidator implements ServiceValidator {
  name = 'Twilio';

  async validate(accountSid: string, authToken: string): Promise<ValidationResult> {
    if (!accountSid || !authToken) {
      return createValidationResult(
        this.name,
        'TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN',
        false,
        'Twilio credentials are not set',
        'Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN from https://console.twilio.com/'
      );
    }

    if (!accountSid.startsWith('AC')) {
      return createValidationResult(
        this.name,
        'TWILIO_ACCOUNT_SID',
        false,
        'Invalid Twilio Account SID format',
        'Account SID should start with AC',
        { sid_preview: maskCredential(accountSid) }
      );
    }

    try {
      // Test credentials by fetching account info
      const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return createValidationResult(
          this.name,
          'TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN',
          true,
          'Valid Twilio credentials',
          undefined,
          {
            account_sid: accountSid,
            friendly_name: data.friendly_name,
            status: data.status,
            sid_preview: maskCredential(accountSid),
            token_preview: maskCredential(authToken),
          }
        );
      } else if (response.status === 401) {
        return createValidationResult(
          this.name,
          'TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN',
          false,
          'Invalid Twilio credentials',
          'Check your credentials at https://console.twilio.com/',
          { status: response.status, sid_preview: maskCredential(accountSid) }
        );
      } else {
        const errorText = await response.text();
        return createValidationResult(
          this.name,
          'TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN',
          false,
          `Twilio API error: ${response.status}`,
          'Check API status at https://status.twilio.com/',
          { status: response.status, error: errorText }
        );
      }
    } catch (error: any) {
      return createValidationResult(
        this.name,
        'TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN',
        false,
        `Failed to validate Twilio API: ${error.message}`,
        'Check network connectivity',
        { error: error.message }
      );
    }
  }
}
