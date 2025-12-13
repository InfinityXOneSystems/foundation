#!/usr/bin/env ts-node
/**
 * Environment Variable Validation Script
 * Validates all environment variables across the InfinityXOneSystems ecosystem
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config();

// Import validators
import { ValidationResult, ServiceHealth } from './validators/types';
import { GitHubValidator } from './validators/github-validator';
import { AnthropicValidator } from './validators/anthropic-validator';
import { GeminiValidator } from './validators/gemini-validator';
import { GroqValidator } from './validators/groq-validator';
import { RedisValidator } from './validators/redis-validator';
import { PostgreSQLValidator } from './validators/postgresql-validator';
import { StripeValidator } from './validators/stripe-validator';
import { TwilioValidator } from './validators/twilio-validator';
import { SendGridValidator } from './validators/sendgrid-validator';
import { GCPValidator } from './validators/gcp-validator';
import { EnvironmentValidator, validators } from '../src/utils/env-validator';

interface ValidationReport {
  timestamp: string;
  overall_status: 'passed' | 'warnings' | 'failed';
  summary: {
    total_variables: number;
    required_missing: number;
    optional_missing: number;
    format_errors: number;
    service_failures: number;
  };
  details: ValidationResult[];
  by_service: ServiceHealth[];
}

// Parse command line arguments
const args = process.argv.slice(2);
const flags = {
  format: args.includes('--format') ? args[args.indexOf('--format') + 1] : 'console',
  strict: args.includes('--strict'),
  quick: args.includes('--quick'),
  service: args.includes('--service') ? args[args.indexOf('--service') + 1] : null,
  report: args.includes('--report'),
};

async function validateEnvironment(): Promise<ValidationReport> {
  const results: ValidationResult[] = [];
  const startTime = new Date().toISOString();

  console.log('🔍 Starting Environment Validation...\n');

  // Initialize validators
  const githubValidator = new GitHubValidator();
  const anthropicValidator = new AnthropicValidator();
  const geminiValidator = new GeminiValidator();
  const groqValidator = new GroqValidator();
  const redisValidator = new RedisValidator();
  const postgresValidator = new PostgreSQLValidator();
  const stripeValidator = new StripeValidator();
  const twilioValidator = new TwilioValidator();
  const sendgridValidator = new SendGridValidator();
  const gcpValidator = new GCPValidator();

  // Validate services based on flags
  if (!flags.service || flags.service === 'github') {
    if (process.env.GITHUB_TOKEN) {
      console.log('Testing GitHub integration...');
      const result = await githubValidator.validate(process.env.GITHUB_TOKEN);
      results.push(result);
    }
  }

  if (!flags.service || flags.service === 'anthropic') {
    if (process.env.ANTHROPIC_API_KEY) {
      console.log('Testing Anthropic API...');
      const result = await anthropicValidator.validate(process.env.ANTHROPIC_API_KEY);
      results.push(result);
    }
  }

  if (!flags.service || flags.service === 'gemini') {
    if (process.env.GOOGLE_AI_API_KEY) {
      console.log('Testing Google Gemini API...');
      const result = await geminiValidator.validate(process.env.GOOGLE_AI_API_KEY);
      results.push(result);
    }
  }

  if (!flags.service || flags.service === 'groq') {
    if (process.env.GROQ_API_KEY) {
      console.log('Testing Groq API...');
      const result = await groqValidator.validate(process.env.GROQ_API_KEY);
      results.push(result);
    }
  }

  if (!flags.quick && (!flags.service || flags.service === 'redis')) {
    if (process.env.REDIS_URL) {
      console.log('Testing Redis connection...');
      const result = await redisValidator.validate(process.env.REDIS_URL);
      results.push(result);
    }
  }

  if (!flags.quick && (!flags.service || flags.service === 'postgresql')) {
    if (process.env.DATABASE_URL || (process.env.PG_HOST && process.env.PG_DATABASE)) {
      console.log('Testing PostgreSQL connection...');
      const result = await postgresValidator.validate({
        url: process.env.DATABASE_URL || undefined,
        host: process.env.PG_HOST || undefined,
        port: process.env.PG_PORT ? parseInt(process.env.PG_PORT) : undefined,
        database: process.env.PG_DATABASE || undefined,
        user: process.env.PG_USER || undefined,
        password: process.env.PG_PASSWORD || undefined,
      });
      results.push(result);
    }
  }

  if (!flags.service || flags.service === 'stripe') {
    if (process.env.STRIPE_API_KEY) {
      console.log('Testing Stripe API...');
      const result = await stripeValidator.validate(process.env.STRIPE_API_KEY);
      results.push(result);
    }
  }

  if (!flags.service || flags.service === 'twilio') {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      console.log('Testing Twilio API...');
      const result = await twilioValidator.validate(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      results.push(result);
    }
  }

  if (!flags.service || flags.service === 'sendgrid') {
    if (process.env.SENDGRID_API_KEY) {
      console.log('Testing SendGrid API...');
      const result = await sendgridValidator.validate(process.env.SENDGRID_API_KEY);
      results.push(result);
    }
  }

  if (!flags.service || flags.service === 'gcp') {
    if (process.env.GOOGLE_GCP_AUTH_JSON) {
      console.log('Testing Google Cloud Platform credentials...');
      const result = await gcpValidator.validate(
        process.env.GOOGLE_GCP_AUTH_JSON,
        process.env.GOOGLE_CLOUD_PROJECT_ID
      );
      results.push(result);
    }
  }

  // Group results by service
  const serviceMap = new Map<string, ServiceHealth>();
  
  for (const result of results) {
    if (!serviceMap.has(result.service)) {
      serviceMap.set(result.service, {
        service: result.service,
        status: 'healthy',
        variables_tested: [],
        issues: [],
      });
    }

    const serviceHealth = serviceMap.get(result.service)!;
    serviceHealth.variables_tested.push(result.variable);

    if (!result.valid) {
      serviceHealth.status = 'unhealthy';
      serviceHealth.issues.push(result.message);
    } else if (result.recommendation) {
      if (serviceHealth.status === 'healthy') {
        serviceHealth.status = 'degraded';
      }
      serviceHealth.issues.push(result.recommendation);
    }
  }

  // Calculate summary
  const validCount = results.filter(r => r.valid).length;
  const invalidCount = results.filter(r => !r.valid).length;
  const warningsCount = results.filter(r => r.valid && r.recommendation).length;

  const overallStatus: 'passed' | 'warnings' | 'failed' = 
    invalidCount > 0 ? 'failed' :
    warningsCount > 0 ? 'warnings' : 'passed';

  return {
    timestamp: startTime,
    overall_status: overallStatus,
    summary: {
      total_variables: results.length,
      required_missing: invalidCount,
      optional_missing: 0,
      format_errors: 0,
      service_failures: invalidCount,
    },
    details: results,
    by_service: Array.from(serviceMap.values()),
  };
}

function printConsoleReport(report: ValidationReport): void {
  console.log('\n🔍 Environment Validation Report');
  console.log('━'.repeat(80));
  console.log('');

  // Print service results
  for (const service of report.by_service) {
    const icon = service.status === 'healthy' ? '✅' : 
                 service.status === 'degraded' ? '⚠️ ' : '❌';
    
    console.log(`${icon} ${service.service}`);
    console.log(`   Variables tested: ${service.variables_tested.join(', ')}`);
    console.log(`   Status: ${service.status.toUpperCase()}`);
    
    if (service.issues.length > 0) {
      service.issues.forEach(issue => {
        console.log(`   Issue: ${issue}`);
      });
    }
    console.log('');
  }

  // Print summary
  console.log('━'.repeat(80));
  console.log(`Summary: ${report.summary.total_variables} variables tested`);
  
  const validCount = report.details.filter(r => r.valid).length;
  const invalidCount = report.summary.service_failures;
  
  console.log(`Valid: ${validCount} | Failed: ${invalidCount}`);
  
  if (report.overall_status === 'passed') {
    console.log('Status: ✅ PASSED - All validations successful');
  } else if (report.overall_status === 'warnings') {
    console.log('Status: ⚠️  WARNINGS - Review recommendations');
  } else {
    console.log('Status: ❌ FAILED - Critical issues found');
  }
  
  console.log('━'.repeat(80));
  console.log('');
}

function printJsonReport(report: ValidationReport): void {
  console.log(JSON.stringify(report, null, 2));
}

async function main() {
  try {
    const report = await validateEnvironment();

    if (flags.format === 'json') {
      printJsonReport(report);
    } else {
      printConsoleReport(report);
    }

    // Write report file if requested
    if (flags.report) {
      const reportPath = path.join(process.cwd(), 'validation-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n📄 Report saved to: ${reportPath}`);
    }

    // Exit with appropriate code
    if (flags.strict && report.overall_status !== 'passed') {
      process.exit(1);
    } else if (report.overall_status === 'failed') {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Validation script failed:', error);
    process.exit(1);
  }
}

// Run if called directly
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

export type { ValidationReport };
