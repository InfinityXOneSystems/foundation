/**
 * Common types for environment validators
 */

export interface ValidationResult {
  valid: boolean;
  service: string;
  variable: string;
  status: 'valid' | 'invalid' | 'missing' | 'warning';
  message: string;
  recommendation?: string | undefined;
  details?: Record<string, any> | undefined;
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
  details?: Record<string, any> | undefined;
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
  recommendation?: string | undefined,
  details?: Record<string, any> | undefined
): ValidationResult {
  return {
    valid,
    service,
    variable,
    status: valid ? 'valid' : 'invalid',
    message,
    ...(recommendation !== undefined && { recommendation }),
    ...(details !== undefined && { details }),
  };
}
