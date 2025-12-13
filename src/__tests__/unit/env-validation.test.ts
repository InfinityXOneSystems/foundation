/**
 * Tests for environment validation system
 */

import { describe, it, expect } from '@jest/globals';
import { maskCredential, createValidationResult } from '../../../scripts/validators/types';

describe('Environment Validation Types', () => {
  describe('maskCredential', () => {
    it('should mask long credentials correctly', () => {
      const credential = 'sk_test_1234567890abcdefghijklmnop';
      const masked = maskCredential(credential);
      expect(masked).toBe('sk_test_***');
    });

    it('should mask short credentials completely', () => {
      const credential = 'short';
      const masked = maskCredential(credential);
      expect(masked).toBe('***');
    });

    it('should handle custom visible chars', () => {
      const credential = 'abcdefghijklmnop';
      const masked = maskCredential(credential, 4);
      expect(masked).toBe('abcd***');
    });

    it('should handle empty strings', () => {
      const masked = maskCredential('');
      expect(masked).toBe('***');
    });
  });

  describe('createValidationResult', () => {
    it('should create valid result', () => {
      const result = createValidationResult(
        'TestService',
        'TEST_VAR',
        true,
        'Test successful'
      );

      expect(result.valid).toBe(true);
      expect(result.service).toBe('TestService');
      expect(result.variable).toBe('TEST_VAR');
      expect(result.status).toBe('valid');
      expect(result.message).toBe('Test successful');
      expect(result.recommendation).toBeUndefined();
      expect(result.details).toBeUndefined();
    });

    it('should create invalid result', () => {
      const result = createValidationResult(
        'TestService',
        'TEST_VAR',
        false,
        'Test failed',
        'Fix the issue'
      );

      expect(result.valid).toBe(false);
      expect(result.status).toBe('invalid');
      expect(result.recommendation).toBe('Fix the issue');
    });

    it('should include details when provided', () => {
      const details = { error: 'connection refused' };
      const result = createValidationResult(
        'TestService',
        'TEST_VAR',
        false,
        'Test failed',
        'Check connection',
        details
      );

      expect(result.details).toEqual(details);
    });
  });
});
