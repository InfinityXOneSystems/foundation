/**
 * Taxonomy Validation System
 * Ensures consistency across multi-provider taxonomy
 * 
 * @package validation
 * @author JARVIS
 * @version 1.0.0
 */

import { EventEmitter } from "events";
import type {
  TaxonomyProvider,
  ModelTier,
  Capability,
  PricingTier,
  ComplianceFramework,
} from "../taxonomy/enterprise-taxonomy";

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export type ValidationSeverity = "error" | "warning" | "info";
export type ValidationCategory = "model" | "capability" | "pricing" | "compliance" | "consistency";

export interface ValidationRule {
  id: string;
  name: string;
  category: ValidationCategory;
  severity: ValidationSeverity;
  description: string;
  validate: (context: ValidationContext) => ValidationResult;
}

export interface ValidationContext {
  provider?: TaxonomyProvider;
  model?: ModelTier;
  capability?: Capability;
  pricing?: PricingTier;
  compliance?: ComplianceFramework;
  allProviders?: TaxonomyProvider[];
}

export interface ValidationResult {
  rule_id: string;
  passed: boolean;
  severity: ValidationSeverity;
  message: string;
  details?: Record<string, unknown> | undefined;
  suggestions?: string[] | undefined;
}

export interface ValidationReport {
  report_id: string;
  timestamp: string;
  provider_name?: string;
  total_rules: number;
  passed: number;
  failed: number;
  warnings: number;
  errors: number;
  results: ValidationResult[];
  summary: string;
}

// ============================================================
// TAXONOMY VALIDATOR
// ============================================================

export class TaxonomyValidator extends EventEmitter {
  private rules: Map<string, ValidationRule>;
  private reports: ValidationReport[];

  constructor() {
    super();
    this.rules = new Map();
    this.reports = [];
    this.initializeDefaultRules();
  }

  /**
   * Initialize default validation rules
   */
  private initializeDefaultRules(): void {
    // Model validation rules
    this.registerRule({
      id: "model-id-format",
      name: "Model ID Format",
      category: "model",
      severity: "error",
      description: "Model ID must follow provider:family:version format",
      validate: (ctx) => {
        if (!ctx.model) {
          return {
            rule_id: "model-id-format",
            passed: true,
            severity: "info",
            message: "No model to validate",
          };
        }

        const idParts = ctx.model.id.split(/[-:]/);
        const hasValidFormat = idParts.length >= 2;

        return {
          rule_id: "model-id-format",
          passed: hasValidFormat,
          severity: "error",
          message: hasValidFormat
            ? "Model ID format is valid"
            : `Invalid model ID format: ${ctx.model.id}`,
          suggestions: hasValidFormat
            ? undefined
            : ["Use format: provider:family:version or provider-family-version"],
        };
      },
    });

    this.registerRule({
      id: "model-context-window",
      name: "Context Window Validation",
      category: "model",
      severity: "warning",
      description: "Context window should be reasonable (1K-2M tokens)",
      validate: (ctx) => {
        if (!ctx.model) {
          return {
            rule_id: "model-context-window",
            passed: true,
            severity: "info",
            message: "No model to validate",
          };
        }

        const contextWindow = ctx.model.token_limits.context_window;
        const isValid = contextWindow >= 1000 && contextWindow <= 2000000;

        return {
          rule_id: "model-context-window",
          passed: isValid,
          severity: "warning",
          message: isValid
            ? `Context window ${contextWindow} is valid`
            : `Unusual context window: ${contextWindow}`,
          details: { context_window: contextWindow },
        };
      },
    });

    // Capability validation rules
    this.registerRule({
      id: "capability-version",
      name: "Capability Version Format",
      category: "capability",
      severity: "warning",
      description: "Capability version should follow semantic versioning",
      validate: (ctx) => {
        if (!ctx.capability) {
          return {
            rule_id: "capability-version",
            passed: true,
            severity: "info",
            message: "No capability to validate",
          };
        }

        const versionRegex = /^v?\d+(\.\d+)*$/;
        const isValid = versionRegex.test(ctx.capability.version);

        return {
          rule_id: "capability-version",
          passed: isValid,
          severity: "warning",
          message: isValid
            ? `Capability version ${ctx.capability.version} is valid`
            : `Invalid version format: ${ctx.capability.version}`,
          suggestions: isValid ? undefined : ["Use semantic versioning: v1, v1.0, v1.0.0"],
        };
      },
    });

    this.registerRule({
      id: "capability-dates",
      name: "Capability Date Consistency",
      category: "capability",
      severity: "error",
      description: "supported_since must be before deprecated_at",
      validate: (ctx) => {
        if (!ctx.capability || !ctx.capability.deprecated_at) {
          return {
            rule_id: "capability-dates",
            passed: true,
            severity: "info",
            message: "No deprecation date to validate",
          };
        }

        const supportedDate = new Date(ctx.capability.supported_since);
        const deprecatedDate = new Date(ctx.capability.deprecated_at);
        const isValid = supportedDate < deprecatedDate;

        return {
          rule_id: "capability-dates",
          passed: isValid,
          severity: "error",
          message: isValid
            ? "Capability dates are consistent"
            : `Deprecated date ${ctx.capability.deprecated_at} is before supported date ${ctx.capability.supported_since}`,
        };
      },
    });

    // Pricing validation rules
    this.registerRule({
      id: "pricing-positive",
      name: "Positive Pricing",
      category: "pricing",
      severity: "error",
      description: "Token prices must be positive numbers",
      validate: (ctx) => {
        if (!ctx.pricing) {
          return {
            rule_id: "pricing-positive",
            passed: true,
            severity: "info",
            message: "No pricing to validate",
          };
        }

        const isValid =
          ctx.pricing.input_tokens > 0 && ctx.pricing.output_tokens > 0;

        return {
          rule_id: "pricing-positive",
          passed: isValid,
          severity: "error",
          message: isValid
            ? "Pricing values are positive"
            : "Pricing must have positive values",
          details: {
            input_tokens: ctx.pricing.input_tokens,
            output_tokens: ctx.pricing.output_tokens,
          },
        };
      },
    });

    this.registerRule({
      id: "pricing-output-higher",
      name: "Output Price Higher",
      category: "pricing",
      severity: "warning",
      description: "Output tokens typically cost more than input tokens",
      validate: (ctx) => {
        if (!ctx.pricing) {
          return {
            rule_id: "pricing-output-higher",
            passed: true,
            severity: "info",
            message: "No pricing to validate",
          };
        }

        const isValid = ctx.pricing.output_tokens >= ctx.pricing.input_tokens;

        return {
          rule_id: "pricing-output-higher",
          passed: isValid,
          severity: "warning",
          message: isValid
            ? "Output pricing is higher than or equal to input pricing"
            : "Output tokens typically cost more than input tokens",
          details: {
            input_tokens: ctx.pricing.input_tokens,
            output_tokens: ctx.pricing.output_tokens,
            ratio: ctx.pricing.output_tokens / ctx.pricing.input_tokens,
          },
        };
      },
    });

    // Compliance validation rules
    this.registerRule({
      id: "compliance-audit-retention",
      name: "Audit Retention Period",
      category: "compliance",
      severity: "warning",
      description: "Audit retention should be at least 90 days",
      validate: (ctx) => {
        if (!ctx.compliance) {
          return {
            rule_id: "compliance-audit-retention",
            passed: true,
            severity: "info",
            message: "No compliance framework to validate",
          };
        }

        const retentionDays = ctx.compliance.audit_requirements.retention_days;
        const isValid = retentionDays >= 90;

        return {
          rule_id: "compliance-audit-retention",
          passed: isValid,
          severity: "warning",
          message: isValid
            ? `Audit retention of ${retentionDays} days meets minimum`
            : `Audit retention of ${retentionDays} days is below recommended 90 days`,
          details: { retention_days: retentionDays },
        };
      },
    });

    // Consistency validation rules
    this.registerRule({
      id: "consistency-model-families",
      name: "Model Family Consistency",
      category: "consistency",
      severity: "error",
      description: "All models must belong to declared model families",
      validate: (ctx) => {
        if (!ctx.provider) {
          return {
            rule_id: "consistency-model-families",
            passed: true,
            severity: "info",
            message: "No provider to validate",
          };
        }

        const declaredFamilies = new Set(Object.keys(ctx.provider.model_families));
        const invalidModels = ctx.provider.models.filter(
          (model) => !declaredFamilies.has(model.family)
        );

        const isValid = invalidModels.length === 0;

        return {
          rule_id: "consistency-model-families",
          passed: isValid,
          severity: "error",
          message: isValid
            ? "All models belong to declared families"
            : `${invalidModels.length} model(s) have undeclared families`,
          details: isValid
            ? undefined
            : {
                invalid_models: invalidModels.map((m) => ({
                  id: m.id,
                  family: m.family,
                })),
              },
          suggestions: isValid
            ? undefined
            : ["Add missing families to model_families or fix model family references"],
        };
      },
    });

    this.registerRule({
      id: "consistency-provider-match",
      name: "Provider Name Match",
      category: "consistency",
      severity: "error",
      description: "Model provider must match taxonomy provider",
      validate: (ctx) => {
        if (!ctx.provider) {
          return {
            rule_id: "consistency-provider-match",
            passed: true,
            severity: "info",
            message: "No provider to validate",
          };
        }

        const invalidModels = ctx.provider.models.filter(
          (model) => model.provider !== ctx.provider!.name
        );

        const isValid = invalidModels.length === 0;

        return {
          rule_id: "consistency-provider-match",
          passed: isValid,
          severity: "error",
          message: isValid
            ? "All models have matching provider names"
            : `${invalidModels.length} model(s) have mismatched providers`,
          details: isValid
            ? undefined
            : {
                invalid_models: invalidModels.map((m) => ({
                  id: m.id,
                  model_provider: m.provider,
                  taxonomy_provider: ctx.provider!.name,
                })),
              },
        };
      },
    });
  }

  /**
   * Register a validation rule
   */
  registerRule(rule: ValidationRule): void {
    if (this.rules.has(rule.id)) {
      throw new Error(`Validation rule already exists: ${rule.id}`);
    }

    this.rules.set(rule.id, rule);
    this.emit("rule_registered", { ruleId: rule.id });
  }

  /**
   * Unregister a validation rule
   */
  unregisterRule(ruleId: string): boolean {
    const deleted = this.rules.delete(ruleId);
    if (deleted) {
      this.emit("rule_unregistered", { ruleId });
    }
    return deleted;
  }

  /**
   * Get all registered rules
   */
  getRules(category?: ValidationCategory): ValidationRule[] {
    const allRules = Array.from(this.rules.values());
    return category ? allRules.filter((r) => r.category === category) : allRules;
  }

  /**
   * Validate a provider taxonomy
   */
  validateProvider(provider: TaxonomyProvider): ValidationReport {
    const reportId = `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    const results: ValidationResult[] = [];

    // Provider-level validation
    const providerContext: ValidationContext = { provider };
    const providerRules = this.getRules("consistency");

    for (const rule of providerRules) {
      const result = rule.validate(providerContext);
      results.push(result);
    }

    // Model-level validation
    for (const model of provider.models) {
      const modelContext: ValidationContext = { provider, model };
      const modelRules = this.getRules("model");

      for (const rule of modelRules) {
        const result = rule.validate(modelContext);
        results.push(result);
      }

      // Capability validation
      for (const capability of Object.values(model.capabilities)) {
        const capContext: ValidationContext = { provider, model, capability };
        const capRules = this.getRules("capability");

        for (const rule of capRules) {
          const result = rule.validate(capContext);
          results.push(result);
        }
      }

      // Pricing validation
      for (const pricing of Object.values(model.pricing)) {
        const pricingContext: ValidationContext = { provider, model, pricing };
        const pricingRules = this.getRules("pricing");

        for (const rule of pricingRules) {
          const result = rule.validate(pricingContext);
          results.push(result);
        }
      }
    }

    const errors = results.filter((r) => !r.passed && r.severity === "error");
    const warnings = results.filter((r) => !r.passed && r.severity === "warning");
    const passed = results.filter((r) => r.passed);

    const report: ValidationReport = {
      report_id: reportId,
      timestamp,
      provider_name: provider.name,
      total_rules: results.length,
      passed: passed.length,
      failed: errors.length + warnings.length,
      warnings: warnings.length,
      errors: errors.length,
      results,
      summary: this.generateSummary(errors.length, warnings.length, passed.length),
    };

    this.reports.push(report);
    this.emit("validation_complete", { reportId, providerName: provider.name });

    return report;
  }

  /**
   * Validate compliance framework
   */
  validateCompliance(compliance: ComplianceFramework): ValidationReport {
    const reportId = `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    const results: ValidationResult[] = [];

    const context: ValidationContext = { compliance };
    const complianceRules = this.getRules("compliance");

    for (const rule of complianceRules) {
      const result = rule.validate(context);
      results.push(result);
    }

    const errors = results.filter((r) => !r.passed && r.severity === "error");
    const warnings = results.filter((r) => !r.passed && r.severity === "warning");
    const passed = results.filter((r) => r.passed);

    const report: ValidationReport = {
      report_id: reportId,
      timestamp,
      total_rules: results.length,
      passed: passed.length,
      failed: errors.length + warnings.length,
      warnings: warnings.length,
      errors: errors.length,
      results,
      summary: this.generateSummary(errors.length, warnings.length, passed.length),
    };

    this.reports.push(report);
    this.emit("validation_complete", { reportId });

    return report;
  }

  /**
   * Cross-provider consistency check
   */
  validateCrossProvider(providers: TaxonomyProvider[]): ValidationReport {
    const reportId = `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    const results: ValidationResult[] = [];

    // Check for duplicate model IDs across providers
    const modelIds = new Map<string, string[]>();
    for (const provider of providers) {
      for (const model of provider.models) {
        if (!modelIds.has(model.id)) {
          modelIds.set(model.id, []);
        }
        modelIds.get(model.id)!.push(provider.name);
      }
    }

    const duplicates = Array.from(modelIds.entries()).filter(
      ([, providerList]) => providerList.length > 1
    );

    results.push({
      rule_id: "cross-provider-unique-ids",
      passed: duplicates.length === 0,
      severity: "error",
      message:
        duplicates.length === 0
          ? "All model IDs are unique across providers"
          : `${duplicates.length} duplicate model ID(s) found`,
      details: duplicates.length > 0 ? { duplicates: Object.fromEntries(duplicates) } : undefined,
    });

    const errors = results.filter((r) => !r.passed && r.severity === "error");
    const warnings = results.filter((r) => !r.passed && r.severity === "warning");
    const passed = results.filter((r) => r.passed);

    const report: ValidationReport = {
      report_id: reportId,
      timestamp,
      total_rules: results.length,
      passed: passed.length,
      failed: errors.length + warnings.length,
      warnings: warnings.length,
      errors: errors.length,
      results,
      summary: this.generateSummary(errors.length, warnings.length, passed.length),
    };

    this.reports.push(report);
    this.emit("validation_complete", { reportId });

    return report;
  }

  /**
   * Get validation report
   */
  getReport(reportId: string): ValidationReport | undefined {
    return this.reports.find((r) => r.report_id === reportId);
  }

  /**
   * Get all validation reports
   */
  getAllReports(): ValidationReport[] {
    return [...this.reports];
  }

  /**
   * Clear validation history
   */
  clearReports(): void {
    this.reports = [];
    this.emit("reports_cleared");
  }

  /**
   * Generate summary message
   */
  private generateSummary(errors: number, warnings: number, passed: number): string {
    if (errors > 0) {
      return `❌ Validation failed: ${errors} error(s), ${warnings} warning(s), ${passed} passed`;
    }
    if (warnings > 0) {
      return `⚠️ Validation passed with warnings: ${warnings} warning(s), ${passed} passed`;
    }
    return `✅ All ${passed} validation(s) passed`;
  }
}
