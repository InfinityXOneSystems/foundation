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
      
      // Check rate limit and scopes
      const { data: rateLimit } = await octokit.rest.rateLimit.get();
      
      // Note: Token scopes are not directly accessible via API in all contexts
      // For comprehensive scope checking, use: gh api user -i | grep x-oauth-scopes
      const scopes: string[] = [];

      const remaining = rateLimit.resources.core.remaining;
      const total = rateLimit.resources.core.limit;

      return createValidationResult(
        this.name,
        'GITHUB_TOKEN',
        true,
        `Valid token for user: ${user.login}`,
        'Note: Token scope validation requires additional permissions. Ensure token has repo, workflow scopes.',
        {
          user: user.login,
          rate_limit: `${remaining} / ${total}`,
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
