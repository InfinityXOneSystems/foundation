/**
 * Common types for environment validators
 */

export interface ValidationResult {
  valid: boolean;
  service: string;
  variable: string;
  status: 'valid' | 'invalid' | 'missing' | 'warning';
  message: string;
  recommendation?: string;
  details?: Record<string, any>;
}

export interface ServiceValidator {
  name: string;
  validate(...args: any[]): Promise<ValidationResult>;
}

export interface ServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  variables_tested: string[];
  issues: string[];
  details?: Record<string, any>;
}

export function maskCredential(credential: string, visibleChars: number = 8): string {
  if (!credential || credential.length <= visibleChars) {
    return '***';
  }
  return credential.substring(0, visibleChars) + '***';
}

export function createValidationResult(
  service: string,
  variable: string,
  valid: boolean,
  message: string,
  recommendation?: string,
  details?: Record<string, any>
): ValidationResult {
  return {
    valid,
    service,
    variable,
    status: valid ? 'valid' : 'invalid',
    message,
    recommendation,
    details,
  };
}
