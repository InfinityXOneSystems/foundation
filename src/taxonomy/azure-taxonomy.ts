/**
 * Microsoft Azure AI Services Taxonomy
 * Comprehensive coverage of Azure OpenAI, Cognitive Services, and Azure AI Studio
 * 
 * @package taxonomy
 * @author JARVIS
 * @version 1.0.0
 */

import { EventEmitter } from "events";
import type {
  ModelFamily,
  TaskType,
  Capability,
  PricingTier,
  TokenLimits,
  ModerationRule,
  ModelTier,
} from "./enterprise-taxonomy";

// ============================================================
// AZURE-SPECIFIC TYPE DEFINITIONS
// ============================================================

export type AzureAuthType = "api_key" | "managed_identity" | "service_principal" | "azure_ad";
export type AzureServiceType = "openai" | "cognitive" | "ai_studio" | "ml_studio";
export type AzureRegion = "eastus" | "westus" | "westeurope" | "uksouth" | "japaneast" | "australiaeast";
export type AzureDeploymentType = "standard" | "provisioned" | "data_zone";

/**
 * Azure-specific authentication configuration
 */
export interface AzureAuthentication {
  type: AzureAuthType;
  resource: string;
  tenant_id?: string;
  client_id?: string;
  environment_vars: {
    endpoint?: string;
    api_key?: string;
    tenant_id?: string;
    client_id?: string;
    client_secret?: string;
  };
  supports_managed_identity: boolean;
  supports_rbac: boolean;
}

/**
 * Azure deployment configuration
 */
export interface AzureDeployment {
  deployment_name: string;
  model_name: string;
  model_version: string;
  deployment_type: AzureDeploymentType;
  region: AzureRegion;
  capacity_units?: number;
  scale_settings?: {
    type: "standard" | "manual";
    capacity?: number;
  };
  created_at: string;
  status: "creating" | "succeeded" | "failed" | "deleting";
}

/**
 * Azure-specific rate limits and quotas
 */
export interface AzureQuotas {
  tokens_per_minute: number;
  requests_per_minute: number;
  requests_per_day: number;
  concurrent_requests: number;
  deployment_quota: number;
  regional_quota: Record<AzureRegion, number>;
}

/**
 * Azure Cognitive Services capability
 */
export interface CognitiveServiceCapability {
  service_name: string;
  api_version: string;
  supported_languages: string[];
  features: string[];
  endpoints: Record<AzureRegion, string>;
}

/**
 * Azure AI Studio project configuration
 */
export interface AIStudioProject {
  project_name: string;
  resource_group: string;
  workspace_id: string;
  compute_resources: Array<{
    name: string;
    type: "compute_instance" | "compute_cluster" | "inference_cluster";
    vm_size: string;
    min_nodes?: number;
    max_nodes?: number;
  }>;
  deployments: AzureDeployment[];
  connected_services: string[];
}

// ============================================================
// AZURE OPENAI SERVICE MODELS
// ============================================================

/**
 * Azure OpenAI Service Model Taxonomy
 * Mirrors OpenAI models with Azure-specific deployment and regional considerations
 */
export const AZURE_OPENAI_MODELS: ModelTier[] = [
  {
    id: "gpt-4o",
    family: "gpt",
    provider: "openai", // Base provider
    version: "2024-08-06",
    release_date: "2024-08-06",
    capabilities: {
      "function_calling": {
        name: "function_calling",
        enabled: true,
        version: "v3",
        supported_since: "2024-08-06",
      },
      "vision": {
        name: "vision",
        enabled: true,
        version: "v1",
        supported_since: "2024-08-06",
      },
      "json_mode": {
        name: "json_mode",
        enabled: true,
        version: "v1",
        supported_since: "2024-08-06",
      },
      "streaming": {
        name: "streaming",
        enabled: true,
        version: "v1",
        supported_since: "2024-08-06",
      },
      "structured_outputs": {
        name: "structured_outputs",
        enabled: true,
        version: "v1",
        supported_since: "2024-08-06",
      },
    },
    task_types: ["chat", "completion", "vision", "code"],
    moderation_rules: [
      {
        type: "content",
        severity: "high",
        enabled: true,
        config: { filter_level: "medium" },
        version: "v1",
      },
    ],
    pricing: {
      "standard": {
        name: "standard",
        input_tokens: 2.50,
        output_tokens: 10.00,
        currency: "USD",
        effective_date: "2024-08-06",
      },
      "batch": {
        name: "batch",
        input_tokens: 1.25,
        output_tokens: 5.00,
        batch_discount: 50,
        currency: "USD",
        effective_date: "2024-08-06",
      },
    },
    token_limits: {
      context_window: 128000,
      max_completion_tokens: 16384,
      max_output_tokens: 16384,
      effective_batch_size: 50000,
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
    supported_formats: ["text", "image"],
    training_data_cutoff: "2023-10",
    metadata: {
      azure_regions: ["eastus", "westus", "westeurope", "uksouth"],
      supports_managed_identity: true,
      supports_vnet: true,
      supports_private_endpoint: true,
    },
  },
  {
    id: "gpt-4o-mini",
    family: "gpt",
    provider: "openai",
    version: "2024-07-18",
    release_date: "2024-07-18",
    capabilities: {
      "function_calling": {
        name: "function_calling",
        enabled: true,
        version: "v3",
        supported_since: "2024-07-18",
      },
      "vision": {
        name: "vision",
        enabled: true,
        version: "v1",
        supported_since: "2024-07-18",
      },
      "json_mode": {
        name: "json_mode",
        enabled: true,
        version: "v1",
        supported_since: "2024-07-18",
      },
      "streaming": {
        name: "streaming",
        enabled: true,
        version: "v1",
        supported_since: "2024-07-18",
      },
    },
    task_types: ["chat", "completion", "vision", "code"],
    moderation_rules: [
      {
        type: "content",
        severity: "high",
        enabled: true,
        config: { filter_level: "medium" },
        version: "v1",
      },
    ],
    pricing: {
      "standard": {
        name: "standard",
        input_tokens: 0.15,
        output_tokens: 0.60,
        currency: "USD",
        effective_date: "2024-07-18",
      },
      "batch": {
        name: "batch",
        input_tokens: 0.075,
        output_tokens: 0.30,
        batch_discount: 50,
        currency: "USD",
        effective_date: "2024-07-18",
      },
    },
    token_limits: {
      context_window: 128000,
      max_completion_tokens: 16384,
      max_output_tokens: 16384,
      effective_batch_size: 50000,
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
    supported_formats: ["text", "image"],
    training_data_cutoff: "2023-10",
    metadata: {
      azure_regions: ["eastus", "westus", "westeurope", "uksouth", "japaneast"],
      supports_managed_identity: true,
      supports_vnet: true,
      supports_private_endpoint: true,
    },
  },
  {
    id: "gpt-4-turbo",
    family: "gpt",
    provider: "openai",
    version: "2024-04-09",
    release_date: "2024-04-09",
    capabilities: {
      "function_calling": {
        name: "function_calling",
        enabled: true,
        version: "v2",
        supported_since: "2024-04-09",
      },
      "vision": {
        name: "vision",
        enabled: true,
        version: "v1",
        supported_since: "2024-04-09",
      },
      "json_mode": {
        name: "json_mode",
        enabled: true,
        version: "v1",
        supported_since: "2024-04-09",
      },
    },
    task_types: ["chat", "completion", "vision", "code"],
    moderation_rules: [
      {
        type: "content",
        severity: "high",
        enabled: true,
        config: { filter_level: "medium" },
        version: "v1",
      },
    ],
    pricing: {
      "standard": {
        name: "standard",
        input_tokens: 10.00,
        output_tokens: 30.00,
        currency: "USD",
        effective_date: "2024-04-09",
      },
    },
    token_limits: {
      context_window: 128000,
      max_completion_tokens: 4096,
      max_output_tokens: 4096,
      effective_batch_size: 50000,
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
    supported_formats: ["text", "image"],
    training_data_cutoff: "2023-12",
    metadata: {
      azure_regions: ["eastus", "westus", "westeurope"],
      supports_managed_identity: true,
      supports_vnet: true,
      supports_private_endpoint: true,
    },
  },
  {
    id: "gpt-35-turbo",
    family: "gpt",
    provider: "openai",
    version: "0125",
    release_date: "2024-01-25",
    capabilities: {
      "function_calling": {
        name: "function_calling",
        enabled: true,
        version: "v1",
        supported_since: "2024-01-25",
      },
      "json_mode": {
        name: "json_mode",
        enabled: true,
        version: "v1",
        supported_since: "2024-01-25",
      },
      "streaming": {
        name: "streaming",
        enabled: true,
        version: "v1",
        supported_since: "2024-01-25",
      },
    },
    task_types: ["chat", "completion", "code"],
    moderation_rules: [
      {
        type: "content",
        severity: "medium",
        enabled: true,
        config: { filter_level: "medium" },
        version: "v1",
      },
    ],
    pricing: {
      "standard": {
        name: "standard",
        input_tokens: 0.50,
        output_tokens: 1.50,
        currency: "USD",
        effective_date: "2024-01-25",
      },
    },
    token_limits: {
      context_window: 16385,
      max_completion_tokens: 4096,
      max_output_tokens: 4096,
      effective_batch_size: 10000,
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
    supported_formats: ["text"],
    training_data_cutoff: "2021-09",
    metadata: {
      azure_regions: ["eastus", "westus", "westeurope", "uksouth", "japaneast", "australiaeast"],
      supports_managed_identity: true,
      supports_vnet: true,
      supports_private_endpoint: true,
      recommended_replacement: "gpt-4o-mini",
    },
  },
  {
    id: "text-embedding-ada-002",
    family: "gpt",
    provider: "openai",
    version: "2",
    release_date: "2022-12-01",
    capabilities: {
      "embeddings": {
        name: "embeddings",
        enabled: true,
        version: "v2",
        supported_since: "2022-12-01",
      },
    },
    task_types: ["embedding"],
    moderation_rules: [],
    pricing: {
      "standard": {
        name: "standard",
        input_tokens: 0.10,
        output_tokens: 0,
        currency: "USD",
        effective_date: "2022-12-01",
      },
    },
    token_limits: {
      context_window: 8191,
      max_completion_tokens: 0,
      max_output_tokens: 0,
      effective_batch_size: 100000,
    },
    status: "general",
    parameters: {
      temperature_min: 0,
      temperature_max: 0,
      top_p_min: 0,
      top_p_max: 0,
      frequency_penalty_min: 0,
      frequency_penalty_max: 0,
      presence_penalty_min: 0,
      presence_penalty_max: 0,
    },
    supported_formats: ["text"],
    training_data_cutoff: "2021-09",
    metadata: {
      azure_regions: ["eastus", "westus", "westeurope", "uksouth", "japaneast", "australiaeast"],
      embedding_dimensions: 1536,
      supports_managed_identity: true,
      supports_vnet: true,
      supports_private_endpoint: true,
    },
  },
  {
    id: "text-embedding-3-large",
    family: "gpt",
    provider: "openai",
    version: "3",
    release_date: "2024-01-25",
    capabilities: {
      "embeddings": {
        name: "embeddings",
        enabled: true,
        version: "v3",
        supported_since: "2024-01-25",
      },
      "dimension_reduction": {
        name: "dimension_reduction",
        enabled: true,
        version: "v1",
        supported_since: "2024-01-25",
      },
    },
    task_types: ["embedding"],
    moderation_rules: [],
    pricing: {
      "standard": {
        name: "standard",
        input_tokens: 0.13,
        output_tokens: 0,
        currency: "USD",
        effective_date: "2024-01-25",
      },
    },
    token_limits: {
      context_window: 8191,
      max_completion_tokens: 0,
      max_output_tokens: 0,
      effective_batch_size: 100000,
    },
    status: "general",
    parameters: {
      temperature_min: 0,
      temperature_max: 0,
      top_p_min: 0,
      top_p_max: 0,
      frequency_penalty_min: 0,
      frequency_penalty_max: 0,
      presence_penalty_min: 0,
      presence_penalty_max: 0,
    },
    supported_formats: ["text"],
    training_data_cutoff: "2023-09",
    metadata: {
      azure_regions: ["eastus", "westus", "westeurope"],
      embedding_dimensions: 3072,
      supports_dimension_reduction: true,
      min_dimensions: 256,
      supports_managed_identity: true,
      supports_vnet: true,
      supports_private_endpoint: true,
    },
  },
  {
    id: "text-embedding-3-small",
    family: "gpt",
    provider: "openai",
    version: "3",
    release_date: "2024-01-25",
    capabilities: {
      "embeddings": {
        name: "embeddings",
        enabled: true,
        version: "v3",
        supported_since: "2024-01-25",
      },
      "dimension_reduction": {
        name: "dimension_reduction",
        enabled: true,
        version: "v1",
        supported_since: "2024-01-25",
      },
    },
    task_types: ["embedding"],
    moderation_rules: [],
    pricing: {
      "standard": {
        name: "standard",
        input_tokens: 0.02,
        output_tokens: 0,
        currency: "USD",
        effective_date: "2024-01-25",
      },
    },
    token_limits: {
      context_window: 8191,
      max_completion_tokens: 0,
      max_output_tokens: 0,
      effective_batch_size: 100000,
    },
    status: "general",
    parameters: {
      temperature_min: 0,
      temperature_max: 0,
      top_p_min: 0,
      top_p_max: 0,
      frequency_penalty_min: 0,
      frequency_penalty_max: 0,
      presence_penalty_min: 0,
      presence_penalty_max: 0,
    },
    supported_formats: ["text"],
    training_data_cutoff: "2023-09",
    metadata: {
      azure_regions: ["eastus", "westus", "westeurope", "uksouth"],
      embedding_dimensions: 1536,
      supports_dimension_reduction: true,
      min_dimensions: 256,
      supports_managed_identity: true,
      supports_vnet: true,
      supports_private_endpoint: true,
    },
  },
];

// ============================================================
// AZURE COGNITIVE SERVICES
// ============================================================

/**
 * Azure Cognitive Services capabilities
 */
export const AZURE_COGNITIVE_SERVICES: CognitiveServiceCapability[] = [
  {
    service_name: "Computer Vision",
    api_version: "4.0",
    supported_languages: ["en", "es", "fr", "de", "it", "pt", "ja", "ko", "zh"],
    features: [
      "image_analysis",
      "ocr",
      "spatial_analysis",
      "face_detection",
      "object_detection",
      "brand_detection",
      "celebrity_recognition",
    ],
    endpoints: {
      eastus: "https://eastus.api.cognitive.microsoft.com/vision/v4.0",
      westus: "https://westus.api.cognitive.microsoft.com/vision/v4.0",
      westeurope: "https://westeurope.api.cognitive.microsoft.com/vision/v4.0",
      uksouth: "https://uksouth.api.cognitive.microsoft.com/vision/v4.0",
      japaneast: "https://japaneast.api.cognitive.microsoft.com/vision/v4.0",
      australiaeast: "https://australiaeast.api.cognitive.microsoft.com/vision/v4.0",
    },
  },
  {
    service_name: "Speech Services",
    api_version: "2024-05-01",
    supported_languages: ["en", "es", "fr", "de", "it", "pt", "ja", "ko", "zh", "ar", "hi", "ru"],
    features: [
      "speech_to_text",
      "text_to_speech",
      "speech_translation",
      "speaker_recognition",
      "pronunciation_assessment",
      "custom_voice",
      "neural_tts",
    ],
    endpoints: {
      eastus: "https://eastus.api.cognitive.microsoft.com/sts/v1.0",
      westus: "https://westus.api.cognitive.microsoft.com/sts/v1.0",
      westeurope: "https://westeurope.api.cognitive.microsoft.com/sts/v1.0",
      uksouth: "https://uksouth.api.cognitive.microsoft.com/sts/v1.0",
      japaneast: "https://japaneast.api.cognitive.microsoft.com/sts/v1.0",
      australiaeast: "https://australiaeast.api.cognitive.microsoft.com/sts/v1.0",
    },
  },
  {
    service_name: "Language Understanding",
    api_version: "3.0",
    supported_languages: ["en", "es", "fr", "de", "it", "pt", "ja", "ko", "zh", "nl", "tr"],
    features: [
      "entity_recognition",
      "key_phrase_extraction",
      "sentiment_analysis",
      "language_detection",
      "question_answering",
      "conversational_language_understanding",
      "custom_ner",
    ],
    endpoints: {
      eastus: "https://eastus.api.cognitive.microsoft.com/language/v3.0",
      westus: "https://westus.api.cognitive.microsoft.com/language/v3.0",
      westeurope: "https://westeurope.api.cognitive.microsoft.com/language/v3.0",
      uksouth: "https://uksouth.api.cognitive.microsoft.com/language/v3.0",
      japaneast: "https://japaneast.api.cognitive.microsoft.com/language/v3.0",
      australiaeast: "https://australiaeast.api.cognitive.microsoft.com/language/v3.0",
    },
  },
  {
    service_name: "Translator",
    api_version: "3.0",
    supported_languages: ["90+ languages"],
    features: [
      "text_translation",
      "document_translation",
      "custom_translator",
      "transliteration",
      "language_detection",
      "dictionary_lookup",
    ],
    endpoints: {
      eastus: "https://api.cognitive.microsofttranslator.com",
      westus: "https://api.cognitive.microsofttranslator.com",
      westeurope: "https://api.cognitive.microsofttranslator.com",
      uksouth: "https://api.cognitive.microsofttranslator.com",
      japaneast: "https://api.cognitive.microsofttranslator.com",
      australiaeast: "https://api.cognitive.microsofttranslator.com",
    },
  },
  {
    service_name: "Form Recognizer",
    api_version: "2024-02-29-preview",
    supported_languages: ["en", "es", "fr", "de", "it", "pt", "nl", "ja", "ko", "zh"],
    features: [
      "document_analysis",
      "prebuilt_models",
      "custom_models",
      "layout_analysis",
      "receipt_processing",
      "invoice_processing",
      "id_document_processing",
      "business_card_processing",
    ],
    endpoints: {
      eastus: "https://eastus.api.cognitive.microsoft.com/formrecognizer/v2.1",
      westus: "https://westus.api.cognitive.microsoft.com/formrecognizer/v2.1",
      westeurope: "https://westeurope.api.cognitive.microsoft.com/formrecognizer/v2.1",
      uksouth: "https://uksouth.api.cognitive.microsoft.com/formrecognizer/v2.1",
      japaneast: "https://japaneast.api.cognitive.microsoft.com/formrecognizer/v2.1",
      australiaeast: "https://australiaeast.api.cognitive.microsoft.com/formrecognizer/v2.1",
    },
  },
];

// ============================================================
// AZURE TAXONOMY SYSTEM
// ============================================================

/**
 * Azure Taxonomy System
 * Manages Azure OpenAI, Cognitive Services, and AI Studio configurations
 */
export class AzureTaxonomy extends EventEmitter {
  private openai_models: Map<string, ModelTier> = new Map();
  private cognitive_services: Map<string, CognitiveServiceCapability> = new Map();
  private deployments: Map<string, AzureDeployment> = new Map();
  private authentication: AzureAuthentication = {
    type: "api_key",
    resource: "https://cognitiveservices.azure.com",
    environment_vars: {},
    supports_managed_identity: false,
    supports_rbac: false,
  };
  private quotas: AzureQuotas = {
    tokens_per_minute: 0,
    requests_per_minute: 0,
    requests_per_day: 0,
    concurrent_requests: 0,
    deployment_quota: 0,
    regional_quota: {
      eastus: 0,
      westus: 0,
      westeurope: 0,
      uksouth: 0,
      japaneast: 0,
      australiaeast: 0,
    },
  };

  constructor() {
    super();
    this.initializeModels();
    this.initializeCognitiveServices();
    this.initializeDefaults();
  }

  /**
   * Initialize Azure OpenAI models
   */
  private initializeModels(): void {
    for (const model of AZURE_OPENAI_MODELS) {
      this.openai_models.set(model.id, model);
    }
    this.emit("azure:models:initialized", { count: this.openai_models.size });
  }

  /**
   * Initialize Cognitive Services
   */
  private initializeCognitiveServices(): void {
    for (const service of AZURE_COGNITIVE_SERVICES) {
      this.cognitive_services.set(service.service_name, service);
    }
    this.emit("azure:cognitive:initialized", { count: this.cognitive_services.size });
  }

  /**
   * Initialize default authentication and quotas
   */
  private initializeDefaults(): void {
    this.authentication = {
      type: "api_key",
      resource: "https://cognitiveservices.azure.com",
      environment_vars: {
        endpoint: "AZURE_OPENAI_ENDPOINT",
        api_key: "AZURE_OPENAI_API_KEY",
      },
      supports_managed_identity: true,
      supports_rbac: true,
    };

    this.quotas = {
      tokens_per_minute: 300000,
      requests_per_minute: 1800,
      requests_per_day: 100000,
      concurrent_requests: 100,
      deployment_quota: 30,
      regional_quota: {
        eastus: 1000000,
        westus: 1000000,
        westeurope: 800000,
        uksouth: 500000,
        japaneast: 500000,
        australiaeast: 300000,
      },
    };
  }

  /**
   * Get Azure OpenAI model by ID
   */
  public getModel(model_id: string): ModelTier | undefined {
    return this.openai_models.get(model_id);
  }

  /**
   * Get all Azure OpenAI models
   */
  public getAllModels(): ModelTier[] {
    return Array.from(this.openai_models.values());
  }

  /**
   * Get models by region
   */
  public getModelsByRegion(region: AzureRegion): ModelTier[] {
    return Array.from(this.openai_models.values()).filter((model) => {
      const regions = model.metadata.azure_regions as AzureRegion[] | undefined;
      return regions?.includes(region);
    });
  }

  /**
   * Get Cognitive Service by name
   */
  public getCognitiveService(service_name: string): CognitiveServiceCapability | undefined {
    return this.cognitive_services.get(service_name);
  }

  /**
   * Get all Cognitive Services
   */
  public getAllCognitiveServices(): CognitiveServiceCapability[] {
    return Array.from(this.cognitive_services.values());
  }

  /**
   * Create deployment
   */
  public createDeployment(deployment: AzureDeployment): void {
    this.deployments.set(deployment.deployment_name, deployment);
    this.emit("azure:deployment:created", { deployment });
  }

  /**
   * Get deployment by name
   */
  public getDeployment(deployment_name: string): AzureDeployment | undefined {
    return this.deployments.get(deployment_name);
  }

  /**
   * Get all deployments
   */
  public getAllDeployments(): AzureDeployment[] {
    return Array.from(this.deployments.values());
  }

  /**
   * Delete deployment
   */
  public deleteDeployment(deployment_name: string): boolean {
    const deleted = this.deployments.delete(deployment_name);
    if (deleted) {
      this.emit("azure:deployment:deleted", { deployment_name });
    }
    return deleted;
  }

  /**
   * Get authentication configuration
   */
  public getAuthentication(): AzureAuthentication {
    return this.authentication;
  }

  /**
   * Update authentication configuration
   */
  public updateAuthentication(auth: Partial<AzureAuthentication>): void {
    this.authentication = { ...this.authentication, ...auth };
    this.emit("azure:auth:updated", { authentication: this.authentication });
  }

  /**
   * Get quotas
   */
  public getQuotas(): AzureQuotas {
    return this.quotas;
  }

  /**
   * Update quotas
   */
  public updateQuotas(quotas: Partial<AzureQuotas>): void {
    this.quotas = { ...this.quotas, ...quotas };
    this.emit("azure:quotas:updated", { quotas: this.quotas });
  }

  /**
   * Get regional availability for a model
   */
  public getRegionalAvailability(model_id: string): AzureRegion[] {
    const model = this.getModel(model_id);
    return (model?.metadata.azure_regions as AzureRegion[]) || [];
  }

  /**
   * Check if model supports managed identity
   */
  public supportsManagedIdentity(model_id: string): boolean {
    const model = this.getModel(model_id);
    return (model?.metadata.supports_managed_identity as boolean) || false;
  }

  /**
   * Check if model supports VNet
   */
  public supportsVNet(model_id: string): boolean {
    const model = this.getModel(model_id);
    return (model?.metadata.supports_vnet as boolean) || false;
  }

  /**
   * Check if model supports private endpoints
   */
  public supportsPrivateEndpoint(model_id: string): boolean {
    const model = this.getModel(model_id);
    return (model?.metadata.supports_private_endpoint as boolean) || false;
  }

  /**
   * Get recommended replacement for deprecated model
   */
  public getRecommendedReplacement(model_id: string): string | undefined {
    const model = this.getModel(model_id);
    return model?.metadata.recommended_replacement as string | undefined;
  }

  /**
   * Export taxonomy to JSON
   */
  public exportTaxonomy(): Record<string, unknown> {
    return {
      models: Array.from(this.openai_models.values()),
      cognitive_services: Array.from(this.cognitive_services.values()),
      deployments: Array.from(this.deployments.values()),
      authentication: this.authentication,
      quotas: this.quotas,
      exported_at: new Date().toISOString(),
    };
  }
}
