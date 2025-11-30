/**
 * Taxonomy Ingestion System
 * Ingest data from OpenAI, Anthropic, Groq, Google APIs
 * Auto-discover models, capabilities, pricing, compliance info
 * 
 * @package ingestion
 * @author JARVIS
 * @version 1.0.0
 */

import { EventEmitter } from "events";

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export type IngestorType = "api" | "webhook" | "batch" | "stream";
export type IngestorStatus = "idle" | "running" | "paused" | "failed";

/**
 * Ingestor configuration
 */
export interface IngestorConfig {
  provider: string;
  type: IngestorType;
  schedule?: string;
  retry_policy: {
    max_retries: number;
    backoff_multiplier: number;
    initial_delay_ms: number;
  };
  rate_limiting: {
    max_requests_per_second: number;
    max_tokens_per_minute?: number;
  };
  enabled: boolean;
}

/**
 * Ingestion job
 */
export interface IngestionJob {
  job_id: string;
  ingestor_id: string;
  provider: string;
  started_at: string;
  completed_at?: string;
  status: "queued" | "running" | "completed" | "failed" | "partial";
  total_items: number;
  processed_items: number;
  failed_items: number;
  errors: Array<{
    item_id: string;
    error: string;
    timestamp: string;
  }>;
  metadata: Record<string, unknown>;
}

/**
 * Model ingestion result
 */
export interface ModelIngestResult {
  model_id: string;
  provider: string;
  name: string;
  capabilities: Record<string, boolean>;
  pricing: {
    input_cost_per_1k: number;
    output_cost_per_1k: number;
    currency: string;
  };
  context_window: number;
  max_output_tokens: number;
  training_cutoff: string;
  status: "new" | "updated" | "unchanged" | "deprecated";
}

/**
 * Ingestion metrics
 */
export interface IngestionMetrics {
  total_jobs: number;
  successful_jobs: number;
  failed_jobs: number;
  partial_jobs: number;
  total_models_ingested: number;
  total_errors: number;
  average_processing_time_seconds: number;
  last_successful_ingest?: string;
  last_failed_ingest?: string;
}

// ============================================================
// TAXONOMY INGESTION SYSTEM
// ============================================================

export class TaxonomyIngestion extends EventEmitter {
  private ingestors: Map<string, IngestorConfig>;
  private jobs: Map<string, IngestionJob>;
  private job_history: IngestionJob[];
  private ingestor_status: Map<string, IngestorStatus>;
  private metrics: Map<string, IngestionMetrics>;
  private audit_log: Array<{
    timestamp: string;
    action: string;
    job_id?: string;
    ingestor_id?: string;
    details: Record<string, unknown>;
    actor: string;
  }>;

  constructor() {
    super();
    this.ingestors = new Map();
    this.jobs = new Map();
    this.job_history = [];
    this.ingestor_status = new Map();
    this.metrics = new Map();
    this.audit_log = [];

    this.initializeDefaultIngestors();
  }

  /**
   * Initialize default ingestors for each provider
   */
  private initializeDefaultIngestors(): void {
    const providers = ["openai", "anthropic", "groq", "google"];

    for (const provider of providers) {
      this.registerIngestor(
        `${provider}_api_ingestor`,
        {
          provider,
          type: "api",
          schedule: "0 */6 * * *",
          retry_policy: {
            max_retries: 3,
            backoff_multiplier: 2,
            initial_delay_ms: 1000,
          },
          rate_limiting: {
            max_requests_per_second: 10,
            max_tokens_per_minute: 90000,
          },
          enabled: true,
        },
        "system"
      );

      // Initialize metrics
      this.metrics.set(provider, {
        total_jobs: 0,
        successful_jobs: 0,
        failed_jobs: 0,
        partial_jobs: 0,
        total_models_ingested: 0,
        total_errors: 0,
        average_processing_time_seconds: 0,
      });
    }
  }

  /**
   * Register ingestor
   */
  public registerIngestor(
    ingestorId: string,
    config: IngestorConfig,
    actor: string
  ): IngestorConfig {
    if (this.ingestors.has(ingestorId)) {
      throw new Error(`Ingestor already registered: ${ingestorId}`);
    }

    this.ingestors.set(ingestorId, config);
    this.ingestor_status.set(ingestorId, "idle");

    const now = new Date().toISOString();
    this.audit_log.push({
      timestamp: now,
      action: "ingestor_registered",
      ingestor_id: ingestorId,
      details: config as unknown as Record<string, unknown>,
      actor,
    });

    this.emit("ingestor_registered", { ingestorId, config });

    return config;
  }

  /**
   * Start ingestion job
   */
  public async startIngestionJob(
    ingestorId: string,
    actor: string
  ): Promise<IngestionJob> {
    const config = this.ingestors.get(ingestorId);
    if (!config) {
      throw new Error(`Ingestor not found: ${ingestorId}`);
    }

    if (!config.enabled) {
      throw new Error(`Ingestor is disabled: ${ingestorId}`);
    }

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const job: IngestionJob = {
      job_id: jobId,
      ingestor_id: ingestorId,
      provider: config.provider,
      started_at: now,
      status: "running",
      total_items: 0,
      processed_items: 0,
      failed_items: 0,
      errors: [],
      metadata: {},
    };

    this.jobs.set(jobId, job);
    this.ingestor_status.set(ingestorId, "running");

    this.audit_log.push({
      timestamp: now,
      action: "ingestion_started",
      job_id: jobId,
      ingestor_id: ingestorId,
      details: { provider: config.provider },
      actor,
    });

    this.emit("ingestion_started", job);

    return job;
  }

  /**
   * Ingest models from provider
   */
  public async ingestModels(
    jobId: string,
    models: Array<{
      model_id: string;
      name: string;
      capabilities: Record<string, boolean>;
      pricing: { input: number; output: number };
      context_window: number;
      max_output_tokens: number;
      training_cutoff: string;
    }>,
    actor: string
  ): Promise<IngestionJob> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    job.total_items = models.length;
    const results: ModelIngestResult[] = [];

    for (const model of models) {
      try {
        const result: ModelIngestResult = {
          model_id: model.model_id,
          provider: job.provider,
          name: model.name,
          capabilities: model.capabilities,
          pricing: {
            input_cost_per_1k: model.pricing.input,
            output_cost_per_1k: model.pricing.output,
            currency: "USD",
          },
          context_window: model.context_window,
          max_output_tokens: model.max_output_tokens,
          training_cutoff: model.training_cutoff,
          status: "new",
        };

        results.push(result);
        job.processed_items += 1;

        this.emit("model_ingested", result);
      } catch (error) {
        job.failed_items += 1;
        job.errors.push({
          item_id: model.model_id,
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
        });

        this.emit("model_ingestion_failed", {
          model_id: model.model_id,
          error,
        });
      }
    }

    this.audit_log.push({
      timestamp: new Date().toISOString(),
      action: "models_ingested",
      job_id: jobId,
      details: {
        provider: job.provider,
        count: job.processed_items,
        failed: job.failed_items,
      },
      actor,
    });

    return job;
  }

  /**
   * Ingest pricing data
   */
  public async ingestPricing(
    jobId: string,
    pricingData: Array<{
      model_id: string;
      tier: string;
      input_cost_per_1k: number;
      output_cost_per_1k: number;
      effective_date: string;
    }>,
    _actor: string
  ): Promise<IngestionJob> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    for (const pricing of pricingData) {
      try {
        this.emit("pricing_ingested", {
          model_id: pricing.model_id,
          tier: pricing.tier,
          cost: {
            input: pricing.input_cost_per_1k,
            output: pricing.output_cost_per_1k,
          },
          effective_date: pricing.effective_date,
        });

        job.processed_items += 1;
      } catch (error) {
        job.failed_items += 1;
        job.errors.push({
          item_id: pricing.model_id,
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
        });
      }
    }

    return job;
  }

  /**
   * Ingest compliance information
   */
  public async ingestCompliance(
    jobId: string,
    complianceData: Array<{
      standard: string;
      provider: string;
      certified: boolean;
      certification_date?: string;
      expiration_date?: string;
      metadata: Record<string, unknown>;
    }>,
    _actor: string
  ): Promise<IngestionJob> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    for (const compliance of complianceData) {
      try {
        this.emit("compliance_ingested", {
          standard: compliance.standard,
          provider: compliance.provider,
          certified: compliance.certified,
          metadata: compliance.metadata,
        });

        job.processed_items += 1;
      } catch (error) {
        job.failed_items += 1;
        job.errors.push({
          item_id: compliance.standard,
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
        });
      }
    }

    return job;
  }

  /**
   * Complete ingestion job
   */
  public completeIngestionJob(
    jobId: string,
    actor: string,
    metadata?: Record<string, unknown>
  ): IngestionJob {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    const now = new Date().toISOString();
    job.completed_at = now;

    if (job.failed_items === 0) {
      job.status = "completed";
      this.ingestor_status.set(job.ingestor_id, "idle");
    } else if (job.processed_items > 0) {
      job.status = "partial";
      this.ingestor_status.set(job.ingestor_id, "idle");
    } else {
      job.status = "failed";
      this.ingestor_status.set(job.ingestor_id, "failed");
    }

    if (metadata) {
      job.metadata = metadata;
    }

    this.job_history.push(job);

    // Update metrics
    this.updateMetrics(job);

    this.audit_log.push({
      timestamp: now,
      action: "ingestion_completed",
      job_id: jobId,
      ingestor_id: job.ingestor_id,
      details: {
        status: job.status,
        processed: job.processed_items,
        failed: job.failed_items,
      },
      actor,
    });

    this.emit("ingestion_completed", job);

    return job;
  }

  /**
   * Update metrics
   */
  private updateMetrics(job: IngestionJob): void {
    const providerMetrics = this.metrics.get(job.provider);
    if (!providerMetrics) return;

    providerMetrics.total_jobs += 1;

    if (job.status === "completed") {
      providerMetrics.successful_jobs += 1;
    } else if (job.status === "failed") {
      providerMetrics.failed_jobs += 1;
    } else if (job.status === "partial") {
      providerMetrics.partial_jobs += 1;
    }

    providerMetrics.total_models_ingested += job.processed_items;
    providerMetrics.total_errors += job.failed_items;

    if (job.completed_at) {
      const duration = new Date(job.completed_at).getTime() - new Date(job.started_at).getTime();
      const durationSeconds = duration / 1000;

      const currentAvg = providerMetrics.average_processing_time_seconds;
      const total = providerMetrics.total_jobs;
      providerMetrics.average_processing_time_seconds =
        (currentAvg * (total - 1) + durationSeconds) / total;

      if (job.status === "completed" || job.status === "partial") {
        providerMetrics.last_successful_ingest = job.completed_at;
      } else {
        providerMetrics.last_failed_ingest = job.completed_at;
      }
    }
  }

  /**
   * Get job status
   */
  public getJobStatus(jobId: string): IngestionJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get provider metrics
   */
  public getProviderMetrics(provider: string): IngestionMetrics | undefined {
    return this.metrics.get(provider);
  }

  /**
   * Get all metrics
   */
  public getAllMetrics(): Record<string, IngestionMetrics> {
    const result: Record<string, IngestionMetrics> = {};

    for (const [provider, metrics] of this.metrics) {
      result[provider] = { ...metrics };
    }

    return result;
  }

  /**
   * Get ingestor status
   */
  public getIngestorStatus(ingestorId: string): IngestorStatus | undefined {
    return this.ingestor_status.get(ingestorId);
  }

  /**
   * Get all ingestors
   */
  public getAllIngestors(): Map<string, IngestorConfig> {
    return new Map(this.ingestors);
  }

  /**
   * Get job history for provider
   */
  public getJobHistory(
    provider: string,
    limit = 100
  ): IngestionJob[] {
    return this.job_history
      .filter((j) => j.provider === provider)
      .slice(-limit);
  }

  /**
   * Get recent jobs
   */
  public getRecentJobs(limit = 10): IngestionJob[] {
    return this.job_history.slice(-limit);
  }

  /**
   * Disable ingestor
   */
  public disableIngestor(ingestorId: string, actor: string): void {
    const config = this.ingestors.get(ingestorId);
    if (!config) {
      throw new Error(`Ingestor not found: ${ingestorId}`);
    }

    config.enabled = false;

    const now = new Date().toISOString();
    this.audit_log.push({
      timestamp: now,
      action: "ingestor_disabled",
      ingestor_id: ingestorId,
      details: {},
      actor,
    });

    this.emit("ingestor_disabled", ingestorId);
  }

  /**
   * Enable ingestor
   */
  public enableIngestor(ingestorId: string, actor: string): void {
    const config = this.ingestors.get(ingestorId);
    if (!config) {
      throw new Error(`Ingestor not found: ${ingestorId}`);
    }

    config.enabled = true;

    const now = new Date().toISOString();
    this.audit_log.push({
      timestamp: now,
      action: "ingestor_enabled",
      ingestor_id: ingestorId,
      details: {},
      actor,
    });

    this.emit("ingestor_enabled", ingestorId);
  }

  /**
   * Get audit log
   */
  public getAuditLog(): Array<{
    timestamp: string;
    action: string;
    job_id?: string;
    ingestor_id?: string;
    details: Record<string, unknown>;
    actor: string;
  }> {
    return [...this.audit_log];
  }

  /**
   * Get ingestion statistics
   */
  public getStatistics(): {
    total_ingestors: number;
    enabled_ingestors: number;
    disabled_ingestors: number;
    total_jobs: number;
    active_jobs: number;
    completed_jobs: number;
    failed_jobs: number;
    providers: Record<string, IngestionMetrics>;
  } {
    const stats = {
      total_ingestors: this.ingestors.size,
      enabled_ingestors: 0,
      disabled_ingestors: 0,
      total_jobs: this.job_history.length,
      active_jobs: this.jobs.size,
      completed_jobs: this.job_history.filter((j) => j.status === "completed").length,
      failed_jobs: this.job_history.filter((j) => j.status === "failed").length,
      providers: this.getAllMetrics(),
    };

    for (const config of this.ingestors.values()) {
      if (config.enabled) {
        stats.enabled_ingestors += 1;
      } else {
        stats.disabled_ingestors += 1;
      }
    }

    return stats;
  }

  /**
   * Validate ingestion system
   */
  public validateSystem(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.ingestors.size === 0) {
      errors.push("No ingestors registered");
    }

    const enabledIngestors = Array.from(this.ingestors.values()).filter(
      (i) => i.enabled
    ).length;

    if (enabledIngestors === 0) {
      errors.push("No enabled ingestors");
    }

    for (const [provider, metrics] of this.metrics) {
      if (metrics.total_jobs === 0) {
        errors.push(`No ingestion jobs for provider: ${provider}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Export default instance
export const taxonomyIngestion = new TaxonomyIngestion();
