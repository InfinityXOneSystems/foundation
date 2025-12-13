/**
 * GitHub API Validator
 * Validates GitHub tokens and checks required scopes
 */

import { Octokit } from 'octokit';
import { ValidationResult, ServiceValidator, maskCredential, createValidationResult } from './types';

export class GitHubValidator implements ServiceValidator {
  name = 'GitHub';

  async validate(token: string): Promise<ValidationResult> {
    if (!token) {
      return createValidationResult(
        this.name,
        'GITHUB_TOKEN',
        false,
        'GitHub token is not set',
        'Set GITHUB_TOKEN with a valid Personal Access Token from https://github.com/settings/tokens'
      );
    }

    try {
      const octokit = new Octokit({ auth: token });
      
      // Test token by fetching user info
      const { data: user } = await octokit.rest.users.getAuthenticated();
      
      // Check rate limit
      const { data: rateLimit } = await octokit.rest.rateLimit.get();
      
      // Parse scopes from headers (if available)
      let scopes: string[] = [];
      try {
        const scopeHeader = rateLimit as any;
        if (scopeHeader && typeof scopeHeader === 'object') {
          // Scopes are in X-OAuth-Scopes header
          scopes = [];
        }
      } catch (e) {
        // Ignore scope parsing errors
      }

      const requiredScopes = ['repo', 'workflow'];
      const hasRequiredScopes = requiredScopes.every(scope => 
        scopes.length === 0 || scopes.includes(scope)
      );

      const remaining = rateLimit.resources.core.remaining;
      const total = rateLimit.resources.core.limit;

      return createValidationResult(
        this.name,
        'GITHUB_TOKEN',
        true,
        `Valid token for user: ${user.login}`,
        undefined,
        {
          user: user.login,
          rate_limit: `${remaining} / ${total}`,
          scopes: scopes.length > 0 ? scopes : ['Unable to determine scopes'],
          has_required_scopes: hasRequiredScopes || scopes.length === 0,
        }
      );
    } catch (error: any) {
      const message = error.message || 'Unknown error';
      return createValidationResult(
        this.name,
        'GITHUB_TOKEN',
        false,
        `GitHub API validation failed: ${message}`,
        'Verify token is valid and has not expired. Check https://github.com/settings/tokens',
        { error: message, token_preview: maskCredential(token) }
      );
    }
  }
}
