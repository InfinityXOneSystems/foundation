/**
 * Environment Variable Validation
 * Validates required environment variables on startup
 *
 * @package utils
 * @author JARVIS
 * @version 1.0.0
 */

export interface EnvVarConfig {
  name: string;
  required: boolean;
  default?: string;
  validator?: (value: string) => boolean;
  description?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missing: string[];
}

export class EnvironmentValidator {
  private config: EnvVarConfig[] = [];

  // Register environment variables
  register(config: EnvVarConfig): void {
    this.config.push(config);
  }

  registerMultiple(configs: EnvVarConfig[]): void {
    configs.forEach((config) => this.register(config));
  }

  // Validate all registered variables
  validate(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const missing: string[] = [];

    for (const config of this.config) {
      const value = process.env[config.name];

      // Check if required variable is missing
      if (config.required && !value) {
        errors.push(`Required environment variable missing: ${config.name}`);
        missing.push(config.name);
        if (config.description) {
          errors.push(`  Description: ${config.description}`);
        }
        continue;
      }

      // Check if optional variable is missing
      if (!config.required && !value) {
        if (config.default) {
          warnings.push(
            `Optional environment variable ${config.name} not set, using default: ${config.default}`
          );
          process.env[config.name] = config.default;
        } else {
          warnings.push(`Optional environment variable ${config.name} not set`);
        }
        continue;
      }

      // Validate value if validator is provided
      if (value && config.validator && !config.validator(value)) {
        errors.push(`Invalid value for ${config.name}: validation failed`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      missing,
    };
  }

  // Validate and throw on error
  validateOrThrow(): void {
    const result = this.validate();

    if (!result.valid) {
      const errorMessage = [
        "Environment validation failed:",
        ...result.errors,
        "",
        "Missing variables:",
        ...result.missing.map((name) => `  - ${name}`),
      ].join("\n");

      throw new Error(errorMessage);
    }

    // Log warnings
    if (result.warnings.length > 0) {
      console.warn("Environment validation warnings:");
      result.warnings.forEach((warning) => console.warn(`  ${warning}`));
    }
  }

  // Print validation report
  printReport(): void {
    const result = this.validate();

    console.log("\n=== Environment Validation Report ===\n");

    if (result.valid) {
      console.log("✅ All required environment variables are set");
    } else {
      console.log("❌ Environment validation failed");
      console.log("\nErrors:");
      result.errors.forEach((error) => console.log(`  ${error}`));
    }

    if (result.warnings.length > 0) {
      console.log("\nWarnings:");
      result.warnings.forEach((warning) => console.log(`  ${warning}`));
    }

    console.log("\n=====================================\n");
  }
}

// Common validators
export const validators = {
  isUrl: (value: string): boolean => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },

  isPort: (value: string): boolean => {
    const port = parseInt(value, 10);
    return !isNaN(port) && port > 0 && port <= 65535;
  },

  isBoolean: (value: string): boolean => {
    return ["true", "false", "1", "0", "yes", "no"].includes(
      value.toLowerCase()
    );
  },

  isNumber: (value: string): boolean => {
    return !isNaN(Number(value));
  },

  isInteger: (value: string): boolean => {
    const num = Number(value);
    return !isNaN(num) && Number.isInteger(num);
  },

  isEmail: (value: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  },

  minLength:
    (min: number) =>
    (value: string): boolean => {
      return value.length >= min;
    },

  maxLength:
    (max: number) =>
    (value: string): boolean => {
      return value.length <= max;
    },

  oneOf:
    (options: string[]) =>
    (value: string): boolean => {
      return options.includes(value);
    },
};

// Standard environment configurations
export const standardEnvVars: EnvVarConfig[] = [
  // GitHub
  {
    name: "GITHUB_TOKEN",
    required: false,
    description: "GitHub Personal Access Token for API access",
  },
  {
    name: "GH_PAT_TOKEN",
    required: false,
    description: "Alternative GitHub PAT token",
  },

  // AI Provider API Keys
  {
    name: "OPENAI_API_KEY",
    required: false,
    description: "OpenAI API key for GPT models",
  },
  {
    name: "GOOGLE_AI_API_KEY",
    required: false,
    description: "Google AI API key for Gemini models",
  },
  {
    name: "ANTHROPIC_API_KEY",
    required: false,
    description: "Anthropic API key for Claude models",
  },
  {
    name: "GROQ_API_KEY",
    required: false,
    description: "Groq API key for fast inference",
  },

  // Service Configuration
  {
    name: "NODE_ENV",
    required: false,
    default: "development",
    validator: validators.oneOf(["development", "production", "test"]),
    description: "Node environment",
  },
  {
    name: "PORT",
    required: false,
    default: "8080",
    validator: validators.isPort,
    description: "Server port",
  },
  {
    name: "LOG_LEVEL",
    required: false,
    default: "info",
    validator: validators.oneOf(["debug", "info", "warn", "error", "fatal"]),
    description: "Logging level",
  },

  // Optional Configuration
  {
    name: "FRONTEND_URL",
    required: false,
    validator: validators.isUrl,
    description: "Frontend application URL",
  },
  {
    name: "FRONTEND_WEBHOOK_URL",
    required: false,
    validator: validators.isUrl,
    description: "Frontend webhook endpoint",
  },
];

// Create configured validator
export function createStandardValidator(): EnvironmentValidator {
  const validator = new EnvironmentValidator();
  validator.registerMultiple(standardEnvVars);
  return validator;
}
