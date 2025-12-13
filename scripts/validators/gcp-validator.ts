/**
 * Google Cloud Platform (GCP) Validator
 * Validates GCP service account credentials
 */

import { ValidationResult, ServiceValidator, createValidationResult } from './types.js';

export class GCPValidator implements ServiceValidator {
  name = 'Google Cloud Platform';

  async validate(credentials: string, projectId?: string): Promise<ValidationResult> {
    if (!credentials) {
      return createValidationResult(
        this.name,
        'GOOGLE_GCP_AUTH_JSON',
        false,
        'GCP credentials are not set',
        'Set GOOGLE_GCP_AUTH_JSON with service account JSON credentials'
      );
    }

    try {
      // Parse credentials JSON
      let credentialsObj: any;
      try {
        credentialsObj = JSON.parse(credentials);
      } catch (e) {
        return createValidationResult(
          this.name,
          'GOOGLE_GCP_AUTH_JSON',
          false,
          'Invalid GCP credentials JSON format',
          'Ensure GOOGLE_GCP_AUTH_JSON contains valid JSON',
          { error: 'JSON parse error' }
        );
      }

      // Validate required fields
      const requiredFields = ['type', 'project_id', 'private_key', 'client_email'];
      const missingFields = requiredFields.filter(field => !credentialsObj[field]);

      if (missingFields.length > 0) {
        return createValidationResult(
          this.name,
          'GOOGLE_GCP_AUTH_JSON',
          false,
          `GCP credentials missing required fields: ${missingFields.join(', ')}`,
          'Ensure you downloaded the complete service account key JSON',
          { missing_fields: missingFields }
        );
      }

      if (credentialsObj.type !== 'service_account') {
        return createValidationResult(
          this.name,
          'GOOGLE_GCP_AUTH_JSON',
          false,
          'GCP credentials must be for a service account',
          'Download service account key from GCP Console',
          { type: credentialsObj.type }
        );
      }

      // Check project ID matches if provided
      const gcpProjectId = credentialsObj.project_id;
      if (projectId && projectId !== gcpProjectId) {
        return createValidationResult(
          this.name,
          'GOOGLE_GCP_AUTH_JSON',
          false,
          'GCP credentials project ID does not match GOOGLE_CLOUD_PROJECT_ID',
          `Update GOOGLE_CLOUD_PROJECT_ID to "${gcpProjectId}" or use matching credentials`,
          {
            credentials_project_id: gcpProjectId,
            expected_project_id: projectId,
          }
        );
      }

      // Basic validation passed
      return createValidationResult(
        this.name,
        'GOOGLE_GCP_AUTH_JSON',
        true,
        'GCP credentials format is valid',
        'Note: Full authentication test requires API access. Test with: gcloud auth activate-service-account',
        {
          project_id: gcpProjectId,
          client_email: credentialsObj.client_email,
          auth_uri: credentialsObj.auth_uri,
        }
      );
    } catch (error: any) {
      return createValidationResult(
        this.name,
        'GOOGLE_GCP_AUTH_JSON',
        false,
        `Failed to validate GCP credentials: ${error.message}`,
        'Check credentials format and content',
        { error: error.message }
      );
    }
  }
}
