/**
 * Enterprise-Grade Taxonomy System
 * Mirrors: OpenAI, Anthropic, Groq, Google standards
 * Foundation template for industry SOP and standards
 * 
 * @package taxonomy
 * @author JARVIS
 * @version 1.0.0
 */

import { EventEmitter } from "events";

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export type ProviderName = "openai" | "anthropic" | "groq" | "google" | "azure";
export type ModelFamily = "gpt" | "claude" | "mixtral" | "llama" | "gemini" | "palm";
export type TaskType = "chat" | "completion" | "embedding" | "reasoning" | "vision" | "audio" | "code" | "search";
export type ModerationType = "content" | "input" | "output" | "safety" | "bias" | "toxicity";
export type CapabilityLevel = "experimental" | "beta" | "general" | "enterprise" | "legacy";

/**
 * Model capability flags
 */
export interface Capability {
  name: string;
  enabled: boolean;
  version: string;
  supported_since: string;
  deprecated_at?: string;
  deprecation_notice?: string;
  replacedBy?: string;
}

/**
 * Pricing tier definition
 */
export interface PricingTier {
  name: string;
  input_tokens: number;
  output_tokens: number;
  batch_discount?: number;
  volume_tiers?: Array<{
    min_tokens: number;
    max_tokens?: number;
    discount_percent: number;
  }>;
  currency: string;
  effective_date: string;
}

/**
 * Context window and token limits
 */
export interface TokenLimits {
  context_window: number;
  max_completion_tokens: number;
  max_output_tokens: number;
  effective_batch_size: number;
}

/**
 * Moderation configuration
 */
export interface ModerationRule {
  type: ModerationType;
  severity: "low" | "medium" | "high" | "critical";
  enabled: boolean;
  config: Record<string, unknown>;
  version: string;
}

/**
 * Model tier definition (e.g., models-v1, models-v2)
 */
export interface ModelTier {
  id: string;
  family: ModelFamily;
  provider: ProviderName;
  version: string;
  release_date: string;
  capabilities: Record<string, Capability>;
  task_types: TaskType[];
  moderation_rules: ModerationRule[];
  pricing: Record<string, PricingTier>;
  token_limits: TokenLimits;
  status: CapabilityLevel;
  parameters: {
    temperature_min: number;
    temperature_max: number;
    top_p_min: number;
    top_p_max: number;
    frequency_penalty_min: number;
    frequency_penalty_max: number;
    presence_penalty_min: number;
    presence_penalty_max: number;
  };
  supported_formats: string[];
  training_data_cutoff: string;
  metadata: Record<string, unknown>;
}

/**
 * Model mapping between providers
 */
export interface ModelMapping {
  source: { provider: ProviderName; model_id: string };
  targets: Array<{
    provider: ProviderName;
    model_id: string;
    compatibility_score: number;
    capability_gaps: string[];
  }>;
  last_updated: string;
  verified: boolean;
}

/**
 * Taxonomy schema
 */
export interface TaxonomySchema {
  version: string;
  last_updated: string;
  providers: Record<ProviderName, TaxonomyProvider>;
  global_moderation_rules: ModerationRule[];
  compliance_framework: ComplianceFramework;
}

/**
 * Provider-specific taxonomy
 */
export interface TaxonomyProvider {
  name: ProviderName;
  models: ModelTier[];
  model_families: Partial<Record<ModelFamily, ModelFamily>>;
  endpoints: Record<string, string>;
  authentication: {
    type: "api_key" | "oauth2" | "jwt";
    header_name: string;
    environment_var: string;
  };
  rate_limits: {
    requests_per_minute: number;
    tokens_per_minute: number;
  };
  retry_policy: {
    max_retries: number;
    backoff_multiplier: number;
    initial_delay_ms: number;
    max_delay_ms: number;
  };
  version: string;
}

/**
 * Compliance framework
 */
export interface ComplianceFramework {
  standards: string[];
  certifications: string[];
  data_residency_requirements: Record<string, string>;
  privacy_policies: Record<string, string>;
  audit_requirements: {
    enabled: boolean;
    retention_days: number;
    encryption: string;
  };
  pii_detection: {
    enabled: boolean;
    patterns: string[];
    masking_strategy: "redact" | "hash" | "encrypt";
  };
  export_controls: {
    enabled: boolean;
    restricted_countries: string[];
    restricted_technologies: string[];
  };
}

// ============================================================
// ENTERPRISE TAXONOMY SYSTEM
// ============================================================

export class EnterpriseTaxonomy extends EventEmitter {
  private schema: TaxonomySchema;
  private modelMappings: Map<string, ModelMapping>;
  private capabilityMatrix: Map<string, Map<string, Capability>>;
  private change_log: Array<{
    timestamp: string;
    action: string;
    model_id: string;
    changes: Record<string, unknown>;
    author: string;
  }>;

  constructor(initialSchema?: TaxonomySchema) {
    super();

    this.schema = initialSchema || this.createDefaultSchema();
    this.modelMappings = new Map();
    this.capabilityMatrix = new Map();
    this.change_log = [];

    this.initializeCapabilityMatrix();
  }

  /**
   * Create default taxonomy schema with industry standards
   */
  private createDefaultSchema(): TaxonomySchema {
    return {
      version: "1.0.0",
      last_updated: new Date().toISOString(),
      providers: {
        openai: this.createOpenAITaxonomy(),
        anthropic: this.createAnthropicTaxonomy(),
        groq: this.createGroqTaxonomy(),
        google: this.createGoogleTaxonomy(),
        azure: this.createOpenAITaxonomy(), // Azure uses similar structure to OpenAI
      },
      global_moderation_rules: this.createGlobalModerationRules(),
      compliance_framework: this.createComplianceFramework(),
    };
  }

  /**
   * Create OpenAI taxonomy
   */
  private createOpenAITaxonomy(): TaxonomyProvider {
    return {
      name: "openai",
      models: [
        {
          id: "gpt-4o",
          family: "gpt",
          provider: "openai",
          version: "4o",
          release_date: "2024-05-13",
          capabilities: {
            vision: {
              name: "vision",
              enabled: true,
              version: "v1",
              supported_since: "2024-05-13",
            },
            function_calling: {
              name: "function_calling",
              enabled: true,
              version: "v1",
              supported_since: "2024-05-13",
            },
            json_mode: {
              name: "json_mode",
              enabled: true,
              version: "v1",
              supported_since: "2024-05-13",
            },
            streaming: {
              name: "streaming",
              enabled: true,
              version: "v1",
              supported_since: "2024-05-13",
            },
            parallel_function_calling: {
              name: "parallel_function_calling",
              enabled: true,
              version: "v1",
              supported_since: "2024-05-13",
            },
          },
          task_types: [
            "chat",
            "completion",
            "vision",
            "reasoning",
            "code",
          ],
          moderation_rules: [],
          pricing: {
            standard: {
              name: "standard",
              input_tokens: 0.005,
              output_tokens: 0.015,
              currency: "USD",
              effective_date: "2024-05-13",
              volume_tiers: [
                {
                  min_tokens: 1000000,
                  discount_percent: 5,
                },
                {
                  min_tokens: 10000000,
                  discount_percent: 10,
                },
              ],
            },
          },
          token_limits: {
            context_window: 128000,
            max_completion_tokens: 4096,
            max_output_tokens: 16384,
            effective_batch_size: 100,
          },
          status: "general",
          parameters: {
            temperature_min: 0,
            temperature_max: 2,
            top_p_min: 0,
            top_p_max: 1,
            frequency_penalty_min: -2,
            frequency_penalty_max: 2,
            presence_penalty_min: -2,
            presence_penalty_max: 2,
          },
          supported_formats: [
            "text",
            "json",
            "markdown",
            "image",
          ],
          training_data_cutoff: "2024-04-09",
          metadata: {
            knowledge_cutoff: "2024-04-09",
            fine_tuning_available: true,
            batch_processing: true,
          },
        },
        {
          id: "gpt-4-turbo",
          family: "gpt",
          provider: "openai",
          version: "4-turbo",
          release_date: "2023-11-06",
          capabilities: {
            vision: {
              name: "vision",
              enabled: true,
              version: "v1",
              supported_since: "2023-11-06",
            },
            function_calling: {
              name: "function_calling",
              enabled: true,
              version: "v1",
              supported_since: "2023-11-06",
            },
          },
          task_types: [
            "chat",
            "completion",
            "vision",
          ],
          moderation_rules: [],
          pricing: {
            standard: {
              name: "standard",
              input_tokens: 0.01,
              output_tokens: 0.03,
              currency: "USD",
              effective_date: "2023-11-06",
            },
          },
          token_limits: {
            context_window: 128000,
            max_completion_tokens: 4096,
            max_output_tokens: 4096,
            effective_batch_size: 100,
          },
          status: "general",
          parameters: {
            temperature_min: 0,
            temperature_max: 2,
            top_p_min: 0,
            top_p_max: 1,
            frequency_penalty_min: -2,
            frequency_penalty_max: 2,
            presence_penalty_min: -2,
            presence_penalty_max: 2,
          },
          supported_formats: [
            "text",
            "json",
            "image",
          ],
          training_data_cutoff: "2023-12-19",
          metadata: {
            knowledge_cutoff: "2023-12-19",
            fine_tuning_available: true,
          },
        },
      ],
      model_families: {
        gpt: "gpt",
      },
      endpoints: {
        chat_completion: "https://api.openai.com/v1/chat/completions",
        embedding: "https://api.openai.com/v1/embeddings",
        moderation: "https://api.openai.com/v1/moderations",
      },
      authentication: {
        type: "api_key",
        header_name: "Authorization",
        environment_var: "OPENAI_API_KEY",
      },
      rate_limits: {
        requests_per_minute: 3500,
        tokens_per_minute: 40000000,
      },
      retry_policy: {
        max_retries: 3,
        backoff_multiplier: 2,
        initial_delay_ms: 1000,
        max_delay_ms: 60000,
      },
      version: "2024-05-13",
    };
  }

  /**
   * Create Anthropic taxonomy
   */
  private createAnthropicTaxonomy(): TaxonomyProvider {
    return {
      name: "anthropic",
      models: [
        {
          id: "claude-3-5-sonnet",
          family: "claude",
          provider: "anthropic",
          version: "3.5-sonnet",
          release_date: "2024-06-20",
          capabilities: {
            vision: {
              name: "vision",
              enabled: true,
              version: "v1",
              supported_since: "2024-06-20",
            },
            extended_thinking: {
              name: "extended_thinking",
              enabled: true,
              version: "v1",
              supported_since: "2024-06-20",
            },
            tool_use: {
              name: "tool_use",
              enabled: true,
              version: "v1",
              supported_since: "2024-06-20",
            },
            batch_processing: {
              name: "batch_processing",
              enabled: true,
              version: "v1",
              supported_since: "2024-06-20",
            },
          },
          task_types: [
            "chat",
            "completion",
            "vision",
            "reasoning",
            "code",
          ],
          moderation_rules: [],
          pricing: {
            standard: {
              name: "standard",
              input_tokens: 0.003,
              output_tokens: 0.015,
              currency: "USD",
              effective_date: "2024-06-20",
              volume_tiers: [
                {
                  min_tokens: 1000000,
                  discount_percent: 10,
                },
              ],
            },
          },
          token_limits: {
            context_window: 200000,
            max_completion_tokens: 4096,
            max_output_tokens: 16000,
            effective_batch_size: 100000,
          },
          status: "general",
          parameters: {
            temperature_min: 0,
            temperature_max: 1,
            top_p_min: 0,
            top_p_max: 1,
            frequency_penalty_min: 0,
            frequency_penalty_max: 1,
            presence_penalty_min: 0,
            presence_penalty_max: 1,
          },
          supported_formats: [
            "text",
            "json",
            "xml",
            "image",
          ],
          training_data_cutoff: "2024-04-01",
          metadata: {
            knowledge_cutoff: "2024-04-01",
            fine_tuning_available: false,
            batch_processing: true,
            max_daily_batch_tokens: 500000000,
          },
        },
      ],
      model_families: {
        claude: "claude",
      },
      endpoints: {
        chat_completion: "https://api.anthropic.com/v1/messages",
        batch: "https://api.anthropic.com/v1/messages/batch",
      },
      authentication: {
        type: "api_key",
        header_name: "x-api-key",
        environment_var: "ANTHROPIC_API_KEY",
      },
      rate_limits: {
        requests_per_minute: 600,
        tokens_per_minute: 40000,
      },
      retry_policy: {
        max_retries: 3,
        backoff_multiplier: 2,
        initial_delay_ms: 500,
        max_delay_ms: 60000,
      },
      version: "2024-06-20",
    };
  }

  /**
   * Create Groq taxonomy
   */
  private createGroqTaxonomy(): TaxonomyProvider {
    return {
      name: "groq",
      models: [
        {
          id: "mixtral-8x7b-32768",
          family: "mixtral",
          provider: "groq",
          version: "8x7b",
          release_date: "2024-01-15",
          capabilities: {
            function_calling: {
              name: "function_calling",
              enabled: true,
              version: "v1",
              supported_since: "2024-01-15",
            },
            json_mode: {
              name: "json_mode",
              enabled: true,
              version: "v1",
              supported_since: "2024-01-15",
            },
            streaming: {
              name: "streaming",
              enabled: true,
              version: "v1",
              supported_since: "2024-01-15",
            },
          },
          task_types: [
            "chat",
            "completion",
            "code",
          ],
          moderation_rules: [],
          pricing: {
            standard: {
              name: "standard",
              input_tokens: 0.00005,
              output_tokens: 0.00015,
              currency: "USD",
              effective_date: "2024-01-15",
            },
          },
          token_limits: {
            context_window: 32768,
            max_completion_tokens: 2048,
            max_output_tokens: 8192,
            effective_batch_size: 100,
          },
          status: "general",
          parameters: {
            temperature_min: 0,
            temperature_max: 2,
            top_p_min: 0,
            top_p_max: 1,
            frequency_penalty_min: 0,
            frequency_penalty_max: 2,
            presence_penalty_min: 0,
            presence_penalty_max: 2,
          },
          supported_formats: [
            "text",
            "json",
          ],
          training_data_cutoff: "2023-12-15",
          metadata: {
            knowledge_cutoff: "2023-12-15",
            fine_tuning_available: false,
            high_speed_inference: true,
          },
        },
      ],
      model_families: {
        mixtral: "mixtral",
      },
      endpoints: {
        chat_completion: "https://api.groq.com/openai/v1/chat/completions",
      },
      authentication: {
        type: "api_key",
        header_name: "Authorization",
        environment_var: "GROQ_API_KEY",
      },
      rate_limits: {
        requests_per_minute: 30,
        tokens_per_minute: 6000,
      },
      retry_policy: {
        max_retries: 2,
        backoff_multiplier: 1.5,
        initial_delay_ms: 500,
        max_delay_ms: 30000,
      },
      version: "2024-01-15",
    };
  }

  /**
   * Create Google taxonomy
   */
  private createGoogleTaxonomy(): TaxonomyProvider {
    return {
      name: "google",
      models: [
        {
          id: "gemini-2.0-flash",
          family: "gemini",
          provider: "google",
          version: "2.0-flash",
          release_date: "2024-12-19",
          capabilities: {
            vision: {
              name: "vision",
              enabled: true,
              version: "v1",
              supported_since: "2024-12-19",
            },
            audio_processing: {
              name: "audio_processing",
              enabled: true,
              version: "v1",
              supported_since: "2024-12-19",
            },
            function_calling: {
              name: "function_calling",
              enabled: true,
              version: "v1",
              supported_since: "2024-12-19",
            },
            code_execution: {
              name: "code_execution",
              enabled: true,
              version: "v1",
              supported_since: "2024-12-19",
            },
            file_handling: {
              name: "file_handling",
              enabled: true,
              version: "v1",
              supported_since: "2024-12-19",
            },
          },
          task_types: [
            "chat",
            "completion",
            "vision",
            "audio",
            "code",
            "search",
          ],
          moderation_rules: [],
          pricing: {
            standard: {
              name: "standard",
              input_tokens: 0.000075,
              output_tokens: 0.0003,
              currency: "USD",
              effective_date: "2024-12-19",
              volume_tiers: [
                {
                  min_tokens: 1000000,
                  discount_percent: 10,
                },
              ],
            },
          },
          token_limits: {
            context_window: 1000000,
            max_completion_tokens: 8192,
            max_output_tokens: 16384,
            effective_batch_size: 1000,
          },
          status: "general",
          parameters: {
            temperature_min: 0,
            temperature_max: 2,
            top_p_min: 0,
            top_p_max: 1,
            frequency_penalty_min: -2,
            frequency_penalty_max: 2,
            presence_penalty_min: -2,
            presence_penalty_max: 2,
          },
          supported_formats: [
            "text",
            "json",
            "markdown",
            "image",
            "audio",
            "video",
          ],
          training_data_cutoff: "2024-04-01",
          metadata: {
            knowledge_cutoff: "2024-04-01",
            fine_tuning_available: true,
            multimodal: true,
            code_execution: true,
          },
        },
        {
          id: "gemini-1.5-pro",
          family: "gemini",
          provider: "google",
          version: "1.5-pro",
          release_date: "2024-02-15",
          capabilities: {
            vision: {
              name: "vision",
              enabled: true,
              version: "v1",
              supported_since: "2024-02-15",
            },
            function_calling: {
              name: "function_calling",
              enabled: true,
              version: "v1",
              supported_since: "2024-02-15",
            },
          },
          task_types: [
            "chat",
            "completion",
            "vision",
          ],
          moderation_rules: [],
          pricing: {
            standard: {
              name: "standard",
              input_tokens: 0.0025,
              output_tokens: 0.0075,
              currency: "USD",
              effective_date: "2024-02-15",
            },
          },
          token_limits: {
            context_window: 1000000,
            max_completion_tokens: 4096,
            max_output_tokens: 8192,
            effective_batch_size: 100,
          },
          status: "general",
          parameters: {
            temperature_min: 0,
            temperature_max: 2,
            top_p_min: 0,
            top_p_max: 1,
            frequency_penalty_min: -2,
            frequency_penalty_max: 2,
            presence_penalty_min: -2,
            presence_penalty_max: 2,
          },
          supported_formats: [
            "text",
            "json",
            "image",
          ],
          training_data_cutoff: "2024-04-01",
          metadata: {
            knowledge_cutoff: "2024-04-01",
            fine_tuning_available: true,
            multimodal: true,
          },
        },
      ],
      model_families: {
        gemini: "gemini",
      },
      endpoints: {
        chat_completion: "https://generativelanguage.googleapis.com/v1beta/models",
        embedding: "https://generativelanguage.googleapis.com/v1beta/models:embedContent",
      },
      authentication: {
        type: "api_key",
        header_name: "x-goog-api-key",
        environment_var: "GOOGLE_API_KEY",
      },
      rate_limits: {
        requests_per_minute: 600,
        tokens_per_minute: 1000000,
      },
      retry_policy: {
        max_retries: 3,
        backoff_multiplier: 2,
        initial_delay_ms: 1000,
        max_delay_ms: 60000,
      },
      version: "2024-12-19",
    };
  }

  /**
   * Create global moderation rules
   */
  private createGlobalModerationRules(): ModerationRule[] {
    return [
      {
        type: "content",
        severity: "high",
        enabled: true,
        config: {
          categories: [
            "hate",
            "harassment",
            "violence",
            "sexual",
            "self_harm",
            "illegal",
          ],
          threshold: 0.7,
        },
        version: "2024-01-01",
      },
      {
        type: "input",
        severity: "medium",
        enabled: true,
        config: {
          max_tokens: 32768,
          validate_encoding: true,
          check_pii: true,
        },
        version: "2024-01-01",
      },
      {
        type: "output",
        severity: "medium",
        enabled: true,
        config: {
          validate_completeness: true,
          check_coherence: true,
        },
        version: "2024-01-01",
      },
      {
        type: "bias",
        severity: "medium",
        enabled: true,
        config: {
          categories: [
            "demographic",
            "gender",
            "racial",
            "religious",
          ],
          threshold: 0.5,
        },
        version: "2024-01-01",
      },
      {
        type: "toxicity",
        severity: "high",
        enabled: true,
        config: {
          threshold: 0.6,
          language_detection: true,
        },
        version: "2024-01-01",
      },
    ];
  }

  /**
   * Create compliance framework
   */
  private createComplianceFramework(): ComplianceFramework {
    return {
      standards: [
        "ISO-27001",
        "SOC-2-Type-II",
        "GDPR",
        "HIPAA",
        "CCPA",
        "ISO-9001",
      ],
      certifications: [
        "SOC-2-Type-II",
        "ISO-27001",
        "HIPAA-BAA",
      ],
      data_residency_requirements: {
        EU: "Data must remain in EU data centers (GDPR)",
        US: "Data may reside in US with adequate safeguards",
        APAC: "Data must comply with local regulations",
      },
      privacy_policies: {
        openai: "https://openai.com/policies/privacy-policy",
        anthropic: "https://www.anthropic.com/privacy",
        groq: "https://groq.com/privacy-policy",
        google: "https://policies.google.com/privacy",
      },
      audit_requirements: {
        enabled: true,
        retention_days: 2555,
        encryption: "AES-256-CBC",
      },
      pii_detection: {
        enabled: true,
        patterns: [
          "email",
          "phone",
          "ssn",
          "credit_card",
          "passport",
          "driver_license",
          "ip_address",
          "api_key",
        ],
        masking_strategy: "encrypt",
      },
      export_controls: {
        enabled: true,
        restricted_countries: [
          "North Korea",
          "Iran",
          "Syria",
          "Cuba",
          "Crimea",
        ],
        restricted_technologies: [
          "weapons_systems",
          "surveillance_equipment",
          "encryption_bypass",
        ],
      },
    };
  }

  /**
   * Initialize capability matrix for quick lookups
   */
  private initializeCapabilityMatrix(): void {
    for (const [providerName, provider] of Object.entries(this.schema.providers)) {
      const providerKey = providerName as ProviderName;
      const matrix = new Map<string, Capability>();

      for (const model of provider.models) {
        for (const [capName, cap] of Object.entries(model.capabilities)) {
          const key = `${model.id}:${capName}`;
          matrix.set(key, cap);
        }
      }

      this.capabilityMatrix.set(providerKey, matrix);
    }
  }

  /**
   * Get model by provider and model ID
   */
  public getModel(provider: ProviderName, modelId: string): ModelTier | undefined {
    const providerData = this.schema.providers[provider];
    return providerData?.models.find((m) => m.id === modelId);
  }

  /**
   * Get all models from provider
   */
  public getProviderModels(provider: ProviderName): ModelTier[] {
    return this.schema.providers[provider]?.models || [];
  }

  /**
   * Check if model has capability
   */
  public hasCapability(
    provider: ProviderName,
    modelId: string,
    capability: string
  ): boolean {
    const model = this.getModel(provider, modelId);
    return model ? capability in model.capabilities : false;
  }

  /**
   * Get pricing for model
   */
  public getPricing(provider: ProviderName, modelId: string, tierName = "standard"): PricingTier | undefined {
    const model = this.getModel(provider, modelId);
    return model?.pricing[tierName];
  }

  /**
   * Get token limits
   */
  public getTokenLimits(provider: ProviderName, modelId: string): TokenLimits | undefined {
    const model = this.getModel(provider, modelId);
    return model?.token_limits;
  }

  /**
   * Create model mapping between providers
   */
  public createModelMapping(
    sourceProvider: ProviderName,
    sourceModelId: string,
    targetMappings: Array<{
      provider: ProviderName;
      modelId: string;
    }>
  ): ModelMapping {
    const sourceModel = this.getModel(sourceProvider, sourceModelId);
    if (!sourceModel) {
      throw new Error(`Source model not found: ${sourceProvider}/${sourceModelId}`);
    }

    const mapping: ModelMapping = {
      source: { provider: sourceProvider, model_id: sourceModelId },
      targets: targetMappings.map((target) => {
        const targetModel = this.getModel(target.provider, target.modelId);
        if (!targetModel) {
          return {
            provider: target.provider,
            model_id: target.modelId,
            compatibility_score: 0,
            capability_gaps: ["Model not found"],
          };
        }

        const gaps = this.calculateCapabilityGaps(sourceModel, targetModel);
        return {
          provider: target.provider,
          model_id: target.modelId,
          compatibility_score: 100 - (gaps.length * 10),
          capability_gaps: gaps,
        };
      }),
      last_updated: new Date().toISOString(),
      verified: false,
    };

    const key = `${sourceProvider}:${sourceModelId}`;
    this.modelMappings.set(key, mapping);

    this.emit("mapping_created", mapping);

    return mapping;
  }

  /**
   * Calculate capability gaps between models
   */
  private calculateCapabilityGaps(source: ModelTier, target: ModelTier): string[] {
    const gaps: string[] = [];
    const sourceCapabilities = Object.keys(source.capabilities);

    for (const capability of sourceCapabilities) {
      if (!(capability in target.capabilities)) {
        gaps.push(capability);
      }
    }

    return gaps;
  }

  /**
   * Get all moderation rules for model
   */
  public getModerationRules(provider: ProviderName, modelId: string): ModerationRule[] {
    const model = this.getModel(provider, modelId);
    return model ? [...this.schema.global_moderation_rules, ...model.moderation_rules] : [];
  }

  /**
   * Update model metadata
   */
  public updateModelMetadata(
    provider: ProviderName,
    modelId: string,
    updates: Record<string, unknown>,
    author: string
  ): void {
    const model = this.getModel(provider, modelId);
    if (!model) {
      throw new Error(`Model not found: ${provider}/${modelId}`);
    }

    const before = JSON.parse(JSON.stringify(model.metadata));

    model.metadata = { ...model.metadata, ...updates };
    this.schema.last_updated = new Date().toISOString();

    this.change_log.push({
      timestamp: new Date().toISOString(),
      action: "update_metadata",
      model_id: modelId,
      changes: {
        before,
        after: model.metadata,
      },
      author,
    });

    this.emit("model_updated", {
      provider,
      modelId,
      updates,
    });
  }

  /**
   * Get schema version
   */
  public getSchemaVersion(): string {
    return this.schema.version;
  }

  /**
   * Get compliance framework
   */
  public getComplianceFramework(): ComplianceFramework {
    return this.schema.compliance_framework;
  }

  /**
   * Export full schema
   */
  public exportSchema(): TaxonomySchema {
    return JSON.parse(JSON.stringify(this.schema));
  }

  /**
   * Export change log
   */
  public getChangeLog(): Array<{
    timestamp: string;
    action: string;
    model_id: string;
    changes: Record<string, unknown>;
    author: string;
  }> {
    return [...this.change_log];
  }

  /**
   * Validate schema integrity
   */
  public validateSchema(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check providers exist
    const providers = ["openai", "anthropic", "groq", "google"];
    for (const provider of providers) {
      if (!(provider in this.schema.providers)) {
        errors.push(`Missing provider: ${provider}`);
      }
    }

    // Check each model has required fields
    for (const [providerName, provider] of Object.entries(this.schema.providers)) {
      for (const model of provider.models) {
        if (!model.id) errors.push(`${providerName}: Model missing id`);
        if (!model.family) errors.push(`${providerName}/${model.id}: Missing family`);
        if (!model.version) errors.push(`${providerName}/${model.id}: Missing version`);
        if (model.token_limits.context_window < 1024) {
          errors.push(
            `${providerName}/${model.id}: Context window too small (< 1024)`
          );
        }
      }
    }

    // Check compliance framework
    if (this.schema.compliance_framework.standards.length === 0) {
      errors.push("Compliance framework missing standards");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Export default instance
export const enterpriseTaxonomy = new EnterpriseTaxonomy();
