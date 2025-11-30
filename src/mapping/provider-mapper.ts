/**
 * Multi-Provider Model Mapping System
 * Translates models and capabilities across OpenAI, Anthropic, Groq, Google
 * 
 * @package mapping
 * @author JARVIS
 * @version 1.0.0
 */

import { EventEmitter } from "events";
import type { ProviderName } from "../taxonomy/enterprise-taxonomy";

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface ModelMapping {
  source_provider: ProviderName;
  source_model: string;
  target_provider: ProviderName;
  target_model: string;
  compatibility_score: number;
  capability_mapping: Record<string, string>;
  parameter_translation: Record<string, string>;
  notes: string[];
}

export interface CapabilityEquivalence {
  capability_name: string;
  openai_version?: string;
  anthropic_version?: string;
  groq_version?: string;
  google_version?: string;
  cross_provider_compatible: boolean;
  differences: string[];
}

export interface ProviderTranslation {
  from_provider: ProviderName;
  to_provider: ProviderName;
  model_tier_mapping: Record<string, string>;
  capability_mapping: Record<string, string>;
  parameter_mapping: Record<string, string>;
  limitations: string[];
}

// ============================================================
// PROVIDER MAPPING SYSTEM
// ============================================================

export class ProviderMapper extends EventEmitter {
  private mappings: Map<string, ModelMapping>;
  private capability_equivalences: Map<string, CapabilityEquivalence>;
  private translations: Map<string, ProviderTranslation>;

  constructor() {
    super();
    this.mappings = new Map();
    this.capability_equivalences = new Map();
    this.translations = new Map();
    this.initializeDefaultMappings();
  }

  /**
   * Initialize default cross-provider mappings
   */
  private initializeDefaultMappings(): void {
    // OpenAI → Anthropic
    this.addMapping({
      source_provider: "openai",
      source_model: "gpt-4o",
      target_provider: "anthropic",
      target_model: "claude-3-5-sonnet",
      compatibility_score: 0.95,
      capability_mapping: {
        "vision": "vision",
        "function_calling": "tool_use",
        "json_mode": "json_mode",
        "streaming": "streaming",
      },
      parameter_translation: {
        "max_tokens": "max_tokens",
        "temperature": "temperature",
        "top_p": "top_p",
      },
      notes: [
        "Both are flagship multimodal models",
        "Claude has larger context window (200K vs 128K)",
        "GPT-4o has better image understanding",
        "Claude has extended thinking capability",
      ],
    });

    // OpenAI → Google
    this.addMapping({
      source_provider: "openai",
      source_model: "gpt-4o",
      target_provider: "google",
      target_model: "gemini-2.0-flash",
      compatibility_score: 0.92,
      capability_mapping: {
        "vision": "vision",
        "function_calling": "function_calling",
        "streaming": "streaming",
      },
      parameter_translation: {
        "max_tokens": "max_output_tokens",
        "temperature": "temperature",
        "top_p": "top_p",
      },
      notes: [
        "Gemini has massive context window (1M tokens)",
        "Gemini supports audio and video natively",
        "Gemini has code execution capability",
        "GPT-4o has better structured output",
      ],
    });

    // OpenAI → Groq
    this.addMapping({
      source_provider: "openai",
      source_model: "gpt-4o",
      target_provider: "groq",
      target_model: "mixtral-8x7b-32768",
      compatibility_score: 0.75,
      capability_mapping: {
        "function_calling": "function_calling",
        "json_mode": "json_mode",
        "streaming": "streaming",
      },
      parameter_translation: {
        "max_tokens": "max_tokens",
        "temperature": "temperature",
        "top_p": "top_p",
      },
      notes: [
        "Groq offers extremely fast inference",
        "Mixtral has smaller context window (32K)",
        "No vision capability in Mixtral",
        "Groq excels at high-throughput scenarios",
      ],
    });

    // Anthropic → Google
    this.addMapping({
      source_provider: "anthropic",
      source_model: "claude-3-5-sonnet",
      target_provider: "google",
      target_model: "gemini-2.0-flash",
      compatibility_score: 0.93,
      capability_mapping: {
        "vision": "vision",
        "tool_use": "function_calling",
        "extended_thinking": "extended_thinking",
        "batch_processing": "batch_processing",
      },
      parameter_translation: {
        "max_tokens": "max_output_tokens",
        "temperature": "temperature",
        "top_p": "top_p",
      },
      notes: [
        "Both have large context windows",
        "Gemini supports more modalities (audio/video)",
        "Claude has better reasoning capabilities",
        "Gemini has native code execution",
      ],
    });

    // Capability equivalences
    this.addCapabilityEquivalence({
      capability_name: "function_calling",
      openai_version: "v1",
      anthropic_version: "v1",
      groq_version: "v1",
      google_version: "v1",
      cross_provider_compatible: true,
      differences: [
        "Anthropic calls it 'tool_use'",
        "Parameter formats vary slightly",
        "All support JSON schema definitions",
      ],
    });

    this.addCapabilityEquivalence({
      capability_name: "vision",
      openai_version: "v1",
      anthropic_version: "v1",
      google_version: "v1",
      cross_provider_compatible: true,
      differences: [
        "Groq's Mixtral doesn't support vision",
        "Google supports video analysis",
        "Image format support varies",
      ],
    });

    this.addCapabilityEquivalence({
      capability_name: "streaming",
      openai_version: "v1",
      anthropic_version: "v1",
      groq_version: "v1",
      google_version: "v1",
      cross_provider_compatible: true,
      differences: [
        "SSE format is standard",
        "Event types differ slightly",
        "All support incremental responses",
      ],
    });

    this.addCapabilityEquivalence({
      capability_name: "extended_thinking",
      anthropic_version: "v1",
      google_version: "v1",
      cross_provider_compatible: false,
      differences: [
        "Not available in OpenAI GPT-4",
        "Not available in Groq Mixtral",
        "Claude and Gemini have reasoning modes",
      ],
    });

    // Provider translations
    this.addTranslation({
      from_provider: "openai",
      to_provider: "anthropic",
      model_tier_mapping: {
        "gpt-4o": "claude-3-5-sonnet",
        "gpt-4-turbo": "claude-3-opus",
        "gpt-3.5-turbo": "claude-3-haiku",
      },
      capability_mapping: {
        "function_calling": "tool_use",
        "json_mode": "json_mode",
      },
      parameter_mapping: {
        "max_tokens": "max_tokens",
        "temperature": "temperature",
      },
      limitations: [
        "Claude context is 200K vs GPT-4o 128K",
        "Different prompt formats",
        "System messages handled differently",
      ],
    });

    this.addTranslation({
      from_provider: "openai",
      to_provider: "google",
      model_tier_mapping: {
        "gpt-4o": "gemini-2.0-flash",
        "gpt-4-turbo": "gemini-1.5-pro",
      },
      capability_mapping: {
        "function_calling": "function_calling",
        "vision": "vision",
      },
      parameter_mapping: {
        "max_tokens": "max_output_tokens",
        "temperature": "temperature",
      },
      limitations: [
        "Gemini has 1M context vs GPT-4o 128K",
        "Different API authentication",
        "Gemini supports multimodal input differently",
      ],
    });

    this.addTranslation({
      from_provider: "anthropic",
      to_provider: "google",
      model_tier_mapping: {
        "claude-3-5-sonnet": "gemini-2.0-flash",
        "claude-3-opus": "gemini-1.5-pro",
      },
      capability_mapping: {
        "tool_use": "function_calling",
        "vision": "vision",
      },
      parameter_mapping: {
        "max_tokens": "max_output_tokens",
        "temperature": "temperature",
      },
      limitations: [
        "Different reasoning approaches",
        "Gemini has code execution",
        "Claude has batch processing",
      ],
    });
  }

  /**
   * Add model mapping
   */
  addMapping(mapping: ModelMapping): void {
    const key = `${mapping.source_provider}:${mapping.source_model}→${mapping.target_provider}:${mapping.target_model}`;
    this.mappings.set(key, mapping);
    this.emit("mapping_added", { key, mapping });
  }

  /**
   * Add capability equivalence
   */
  addCapabilityEquivalence(equivalence: CapabilityEquivalence): void {
    this.capability_equivalences.set(equivalence.capability_name, equivalence);
    this.emit("equivalence_added", { capability: equivalence.capability_name });
  }

  /**
   * Add provider translation
   */
  addTranslation(translation: ProviderTranslation): void {
    const key = `${translation.from_provider}→${translation.to_provider}`;
    this.translations.set(key, translation);
    this.emit("translation_added", { key });
  }

  /**
   * Find equivalent model in target provider
   */
  findEquivalentModel(
    sourceProvider: ProviderName,
    sourceModel: string,
    targetProvider: ProviderName
  ): ModelMapping | undefined {
    const key = `${sourceProvider}:${sourceModel}→${targetProvider}:`;
    
    for (const [mapKey, mapping] of this.mappings.entries()) {
      if (mapKey.startsWith(key)) {
        return mapping;
      }
    }

    return undefined;
  }

  /**
   * Get all mappings for a source model
   */
  getMappingsForModel(provider: ProviderName, modelId: string): ModelMapping[] {
    const prefix = `${provider}:${modelId}→`;
    const results: ModelMapping[] = [];

    for (const [key, mapping] of this.mappings.entries()) {
      if (key.startsWith(prefix)) {
        results.push(mapping);
      }
    }

    return results.sort((a, b) => b.compatibility_score - a.compatibility_score);
  }

  /**
   * Get capability equivalence
   */
  getCapabilityEquivalence(capabilityName: string): CapabilityEquivalence | undefined {
    return this.capability_equivalences.get(capabilityName);
  }

  /**
   * Get provider translation
   */
  getTranslation(
    fromProvider: ProviderName,
    toProvider: ProviderName
  ): ProviderTranslation | undefined {
    const key = `${fromProvider}→${toProvider}`;
    return this.translations.get(key);
  }

  /**
   * Translate model request between providers
   */
  translateRequest(
    sourceProvider: ProviderName,
    sourceModel: string,
    targetProvider: ProviderName,
    parameters: Record<string, unknown>
  ): {
    target_model: string;
    translated_parameters: Record<string, unknown>;
    warnings: string[];
  } {
    const mapping = this.findEquivalentModel(sourceProvider, sourceModel, targetProvider);
    const translation = this.getTranslation(sourceProvider, targetProvider);
    const warnings: string[] = [];

    if (!mapping) {
      warnings.push(`No direct mapping found for ${sourceModel} to ${targetProvider}`);
      return {
        target_model: sourceModel,
        translated_parameters: parameters,
        warnings,
      };
    }

    const translatedParams: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(parameters)) {
      const translatedKey = mapping.parameter_translation[key] || key;
      translatedParams[translatedKey] = value;
    }

    if (translation) {
      warnings.push(...translation.limitations);
    }

    return {
      target_model: mapping.target_model,
      translated_parameters: translatedParams,
      warnings,
    };
  }

  /**
   * Check if capability is supported across providers
   */
  isCrossProviderCapable(
    capabilityName: string,
    providers: ProviderName[]
  ): {
    supported: boolean;
    available_in: ProviderName[];
    missing_from: ProviderName[];
    notes: string[];
  } {
    const equivalence = this.getCapabilityEquivalence(capabilityName);
    const availableIn: ProviderName[] = [];
    const missingFrom: ProviderName[] = [];

    for (const provider of providers) {
      const hasCapability = this.providerHasCapability(provider, capabilityName, equivalence);
      if (hasCapability) {
        availableIn.push(provider);
      } else {
        missingFrom.push(provider);
      }
    }

    return {
      supported: missingFrom.length === 0,
      available_in: availableIn,
      missing_from: missingFrom,
      notes: equivalence?.differences || [],
    };
  }

  /**
   * Check if provider has capability
   */
  private providerHasCapability(
    provider: ProviderName,
    capabilityName: string,
    equivalence?: CapabilityEquivalence
  ): boolean {
    if (!equivalence) return false;

    switch (provider) {
      case "openai":
        return equivalence.openai_version !== undefined;
      case "anthropic":
        return equivalence.anthropic_version !== undefined;
      case "groq":
        return equivalence.groq_version !== undefined;
      case "google":
        return equivalence.google_version !== undefined;
      default:
        return false;
    }
  }

  /**
   * Get migration path between providers
   */
  getMigrationPath(
    fromProvider: ProviderName,
    toProvider: ProviderName,
    currentModel: string
  ): {
    recommended_model: string | null;
    compatibility_score: number;
    required_changes: string[];
    breaking_changes: string[];
    migration_steps: string[];
  } {
    const mapping = this.findEquivalentModel(fromProvider, currentModel, toProvider);
    const translation = this.getTranslation(fromProvider, toProvider);

    if (!mapping) {
      return {
        recommended_model: null,
        compatibility_score: 0,
        required_changes: ["No direct equivalent found"],
        breaking_changes: ["Manual model selection required"],
        migration_steps: ["Research and select appropriate model manually"],
      };
    }

    const requiredChanges: string[] = [];
    const breakingChanges: string[] = [];
    const migrationSteps: string[] = [];

    // Check parameter changes
    for (const [sourceParam, targetParam] of Object.entries(
      mapping.parameter_translation
    )) {
      if (sourceParam !== targetParam) {
        requiredChanges.push(`Rename parameter: ${sourceParam} → ${targetParam}`);
      }
    }

    // Check capability changes
    for (const [sourceCap, targetCap] of Object.entries(mapping.capability_mapping)) {
      if (sourceCap !== targetCap) {
        requiredChanges.push(`Update capability: ${sourceCap} → ${targetCap}`);
      }
    }

    // Add migration steps
    migrationSteps.push(`Update model reference: ${currentModel} → ${mapping.target_model}`);
    migrationSteps.push(`Update API endpoint to ${toProvider}`);
    migrationSteps.push("Update authentication method");
    migrationSteps.push("Update parameter names according to mapping");
    migrationSteps.push("Test with sample requests");
    migrationSteps.push("Monitor compatibility score and adjust");

    if (translation) {
      breakingChanges.push(...translation.limitations);
    }

    return {
      recommended_model: mapping.target_model,
      compatibility_score: mapping.compatibility_score,
      required_changes: requiredChanges,
      breaking_changes: breakingChanges,
      migration_steps: migrationSteps,
    };
  }

  /**
   * Get all mappings
   */
  getAllMappings(): ModelMapping[] {
    return Array.from(this.mappings.values());
  }

  /**
   * Get all capability equivalences
   */
  getAllCapabilityEquivalences(): CapabilityEquivalence[] {
    return Array.from(this.capability_equivalences.values());
  }

  /**
   * Get all translations
   */
  getAllTranslations(): ProviderTranslation[] {
    return Array.from(this.translations.values());
  }
}
