/**
 * Evolution Document Synchronization System
 * Syncs taxonomy changes with evolution docs, tracks versioning
 * 
 * @package evolution
 * @author JARVIS
 * @version 1.0.0
 */

import { EventEmitter } from "events";

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export type ChangeType = "added" | "modified" | "removed" | "deprecated" | "migrated";
export type ResourceType = "model" | "capability" | "pricing" | "compliance" | "sop" | "tag";
export type EvolutionPhase = "research" | "design" | "implementation" | "testing" | "deployment" | "monitoring" | "optimization";

/**
 * Change record
 */
export interface Change {
  id: string;
  timestamp: string;
  change_type: ChangeType;
  resource_type: ResourceType;
  resource_id: string;
  resource_name: string;
  description: string;
  version_from: string;
  version_to: string;
  impact_analysis: {
    breaking_changes: boolean;
    migration_required: boolean;
    affected_models: string[];
    affected_sops: string[];
    estimated_migration_time_hours: number;
  };
  migration_guide?: {
    old_approach: string;
    new_approach: string;
    migration_steps: string[];
    rollback_steps?: string[];
  };
  metadata: Record<string, unknown>;
  author: string;
}

/**
 * Evolution document
 */
export interface EvolutionDocument {
  id: string;
  title: string;
  description: string;
  phase: EvolutionPhase;
  status: "draft" | "active" | "complete" | "archived";
  start_date: string;
  target_completion_date: string;
  actual_completion_date?: string;
  objectives: string[];
  success_criteria: string[];
  changes: Change[];
  related_changes: string[];
  resources: {
    documentation_url?: string;
    implementation_branch?: string;
    discussion_thread?: string;
    roadmap_item?: string;
  };
  team: {
    lead: string;
    contributors: string[];
    stakeholders: string[];
  };
  metrics: {
    total_changes: number;
    breaking_changes: number;
    models_affected: number;
    sops_affected: number;
    estimated_completion_percentage: number;
  };
  audit_trail: Array<{
    timestamp: string;
    action: string;
    actor: string;
    changes: Record<string, unknown>;
  }>;
}

/**
 * Taxonomy change event
 */
export interface TaxonomyChangeEvent {
  event_id: string;
  timestamp: string;
  change_type: ChangeType;
  provider: string;
  model_id?: string;
  capability_name?: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  triggered_by: string;
}

/**
 * Change impact assessment
 */
export interface ImpactAssessment {
  change_id: string;
  affected_models: string[];
  affected_sops: string[];
  affected_users: number;
  compatibility_score: number;
  risk_level: "low" | "medium" | "high" | "critical";
  recommendations: string[];
  mitigation_strategies: string[];
}

// ============================================================
// EVOLUTION SYNCHRONIZATION SYSTEM
// ============================================================

export class EvolutionSync extends EventEmitter {
  private evolution_docs: Map<string, EvolutionDocument>;
  private changes: Map<string, Change>;
  private taxonomy_events: TaxonomyChangeEvent[];
  private impact_assessments: Map<string, ImpactAssessment>;
  private change_log: Array<{
    timestamp: string;
    action: string;
    doc_id: string;
    change_id?: string;
    details: Record<string, unknown>;
    actor: string;
  }>;
  private version_index: Map<string, Map<string, string>>;

  constructor() {
    super();
    this.evolution_docs = new Map();
    this.changes = new Map();
    this.taxonomy_events = [];
    this.impact_assessments = new Map();
    this.change_log = [];
    this.version_index = new Map();
  }

  /**
   * Create evolution document
   */
  public createEvolutionDoc(
    id: string,
    title: string,
    description: string,
    phase: EvolutionPhase,
    objectives: string[],
    successCriteria: string[],
    targetCompletionDate: string,
    teamLead: string,
    stakeholders: string[] = []
  ): EvolutionDocument {
    if (this.evolution_docs.has(id)) {
      throw new Error(`Evolution document already exists: ${id}`);
    }

    const now = new Date().toISOString();

    const doc: EvolutionDocument = {
      id,
      title,
      description,
      phase,
      status: "draft",
      start_date: now,
      target_completion_date: targetCompletionDate,
      objectives,
      success_criteria: successCriteria,
      changes: [],
      related_changes: [],
      resources: {},
      team: {
        lead: teamLead,
        contributors: [teamLead],
        stakeholders,
      },
      metrics: {
        total_changes: 0,
        breaking_changes: 0,
        models_affected: 0,
        sops_affected: 0,
        estimated_completion_percentage: 0,
      },
      audit_trail: [
        {
          timestamp: now,
          action: "created",
          actor: teamLead,
          changes: { initial: true },
        },
      ],
    };

    this.evolution_docs.set(id, doc);

    this.change_log.push({
      timestamp: now,
      action: "evolution_doc_created",
      doc_id: id,
      details: { title, phase },
      actor: teamLead,
    });

    this.emit("evolution_doc_created", doc);

    return doc;
  }

  /**
   * Record taxonomy change
   */
  public recordTaxonomyChange(
    changeType: ChangeType,
    resourceType: ResourceType,
    resourceId: string,
    resourceName: string,
    description: string,
    versionFrom: string,
    versionTo: string,
    beforeState: Record<string, unknown>,
    afterState: Record<string, unknown>,
    author: string,
    impactAnalysis?: {
      breaking: boolean;
      migration: boolean;
      affectedModels: string[];
      affectedSOPs: string[];
      migrationTimeHours: number;
    }
  ): Change {
    const changeId = `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const change: Change = {
      id: changeId,
      timestamp: now,
      change_type: changeType,
      resource_type: resourceType,
      resource_id: resourceId,
      resource_name: resourceName,
      description,
      version_from: versionFrom,
      version_to: versionTo,
      impact_analysis: {
        breaking_changes: impactAnalysis?.breaking || false,
        migration_required: impactAnalysis?.migration || false,
        affected_models: impactAnalysis?.affectedModels || [],
        affected_sops: impactAnalysis?.affectedSOPs || [],
        estimated_migration_time_hours: impactAnalysis?.migrationTimeHours || 0,
      },
      metadata: {},
      author,
    };

    this.changes.set(changeId, change);

    // Record taxonomy event
    const provider = resourceType === "model" ? (resourceId.split(":")[0] || "") : "";
    const event: TaxonomyChangeEvent = {
      event_id: changeId,
      timestamp: now,
      change_type: changeType,
      provider,
      ...(resourceType === "model" && { model_id: resourceId }),
      ...(resourceType === "capability" && { capability_name: resourceName }),
      before: beforeState,
      after: afterState,
      triggered_by: author,
    };

    this.taxonomy_events.push(event);

    // Perform impact assessment
    this.assessImpact(changeId, change);

    this.emit("taxonomy_change_recorded", change);

    return change;
  }

  /**
   * Assess impact of change
   */
  private assessImpact(changeId: string, change: Change): void {
    const assessment: ImpactAssessment = {
      change_id: changeId,
      affected_models: change.impact_analysis.affected_models,
      affected_sops: change.impact_analysis.affected_sops,
      affected_users: 0,
      compatibility_score: this.calculateCompatibilityScore(change),
      risk_level: this.calculateRiskLevel(change),
      recommendations: this.generateRecommendations(change),
      mitigation_strategies: this.generateMitigation(change),
    };

    this.impact_assessments.set(changeId, assessment);

    this.emit("impact_assessed", assessment);
  }

  /**
   * Calculate compatibility score
   */
  private calculateCompatibilityScore(change: Change): number {
    let score = 100;

    if (change.impact_analysis.breaking_changes) score -= 50;
    if (change.impact_analysis.migration_required) score -= 25;

    score -= Math.min(change.impact_analysis.affected_models.length * 5, 20);
    score -= Math.min(change.impact_analysis.affected_sops.length * 3, 15);

    return Math.max(0, score);
  }

  /**
   * Calculate risk level
   */
  private calculateRiskLevel(
    change: Change
  ): "low" | "medium" | "high" | "critical" {
    if (change.impact_analysis.breaking_changes) {
      if (change.impact_analysis.affected_models.length > 5) return "critical";
      return "high";
    }

    if (change.impact_analysis.migration_required) {
      if (change.impact_analysis.affected_sops.length > 3) return "high";
      return "medium";
    }

    if (change.impact_analysis.affected_models.length > 3) return "medium";

    return "low";
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(change: Change): string[] {
    const recommendations: string[] = [];

    if (change.impact_analysis.breaking_changes) {
      recommendations.push(
        "Review all dependent systems before deploying breaking change"
      );
      recommendations.push(
        "Prepare migration guide for all affected users"
      );
      recommendations.push(
        "Schedule deprecation period before removal"
      );
    }

    if (change.impact_analysis.migration_required) {
      const hours = change.impact_analysis.estimated_migration_time_hours;
      recommendations.push(
        `Plan ${hours}-hour migration window for affected services`
      );
      recommendations.push(
        "Provide automated migration tooling if possible"
      );
    }

    recommendations.push("Document all changes in changelog");
    recommendations.push("Add to release notes and announce to stakeholders");

    return recommendations;
  }

  /**
   * Generate mitigation strategies
   */
  private generateMitigation(change: Change): string[] {
    const strategies: string[] = [];

    if (change.impact_analysis.breaking_changes) {
      strategies.push("Implement feature flag for gradual rollout");
      strategies.push("Provide long deprecation period (6+ months)");
      strategies.push("Maintain backward compatibility shim if possible");
    }

    if (change.impact_analysis.migration_required) {
      strategies.push("Provide migration scripts");
      strategies.push("Create comprehensive migration guide");
      strategies.push("Offer migration support hotline");
    }

    strategies.push("Monitor adoption and gather feedback");
    strategies.push("Be prepared for quick rollback if needed");

    return strategies;
  }

  /**
   * Link change to evolution document
   */
  public linkChangeToEvolution(
    changeId: string,
    evolutionDocId: string,
    linkActor: string
  ): void {
    const change = this.changes.get(changeId);
    const doc = this.evolution_docs.get(evolutionDocId);

    if (!change || !doc) {
      throw new Error("Change or evolution document not found");
    }

    if (!doc.changes.includes(changeId as unknown as Change)) {
      doc.changes.push(changeId as unknown as Change);
    }

    const now = new Date().toISOString();
    doc.audit_trail.push({
      timestamp: now,
      action: "change_linked",
      actor: linkActor,
      changes: { change_id: changeId },
    });

    this.updateMetrics(evolutionDocId);

    this.emit("change_linked", { changeId, evolutionDocId });
  }

  /**
   * Update evolution document metrics
   */
  private updateMetrics(evolutionDocId: string): void {
    const doc = this.evolution_docs.get(evolutionDocId);
    if (!doc) return;

    doc.metrics.total_changes = doc.changes.length;

    const affectedModels = new Set<string>();
    const affectedSOPs = new Set<string>();
    let breakingCount = 0;

    for (const changeId of doc.changes) {
      const change = this.changes.get(changeId as unknown as string);
      if (change) {
        if (change.impact_analysis.breaking_changes) breakingCount += 1;

        change.impact_analysis.affected_models.forEach((m) =>
          affectedModels.add(m)
        );
        change.impact_analysis.affected_sops.forEach((s) =>
          affectedSOPs.add(s)
        );
      }
    }

    doc.metrics.breaking_changes = breakingCount;
    doc.metrics.models_affected = affectedModels.size;
    doc.metrics.sops_affected = affectedSOPs.size;
  }

  /**
   * Progress evolution document
   */
  public progressPhase(
    evolutionDocId: string,
    newPhase: EvolutionPhase,
    actor: string,
    completionPercentage?: number
  ): EvolutionDocument {
    const doc = this.evolution_docs.get(evolutionDocId);
    if (!doc) {
      throw new Error(`Evolution document not found: ${evolutionDocId}`);
    }

    const oldPhase = doc.phase;
    doc.phase = newPhase;

    if (completionPercentage !== undefined) {
      doc.metrics.estimated_completion_percentage = completionPercentage;
    }

    if (newPhase === "deployment" && doc.status === "draft") {
      doc.status = "active";
    }

    if (newPhase === "optimization" && doc.status === "active") {
      doc.actual_completion_date = new Date().toISOString();
      doc.status = "complete";
    }

    const now = new Date().toISOString();
    doc.audit_trail.push({
      timestamp: now,
      action: "phase_progressed",
      actor,
      changes: { from: oldPhase, to: newPhase, completion_percentage: completionPercentage },
    });

    this.change_log.push({
      timestamp: now,
      action: "phase_progressed",
      doc_id: evolutionDocId,
      details: { old_phase: oldPhase, new_phase: newPhase },
      actor,
    });

    this.emit("phase_progressed", doc);

    return doc;
  }

  /**
   * Get evolution document
   */
  public getEvolutionDoc(docId: string): EvolutionDocument | undefined {
    return this.evolution_docs.get(docId);
  }

  /**
   * Get change
   */
  public getChange(changeId: string): Change | undefined {
    return this.changes.get(changeId);
  }

  /**
   * Get impact assessment
   */
  public getImpactAssessment(changeId: string): ImpactAssessment | undefined {
    return this.impact_assessments.get(changeId);
  }

  /**
   * Search evolution documents
   */
  public searchEvolutionDocs(query: Record<string, unknown>): EvolutionDocument[] {
    const results: EvolutionDocument[] = [];

    for (const doc of this.evolution_docs.values()) {
      let matches = true;

      if (query.phase && doc.phase !== query.phase) matches = false;
      if (query.status && doc.status !== query.status) matches = false;
      if (
        query.title &&
        !doc.title.toLowerCase().includes((query.title as string).toLowerCase())
      )
        matches = false;
      if (
        query.lead &&
        doc.team.lead !== query.lead
      )
        matches = false;

      if (matches) {
        results.push(doc);
      }
    }

    return results;
  }

  /**
   * Generate taxonomy evolution report
   */
  public generateEvolutionReport(
    evolutionDocId: string
  ): {
    doc: EvolutionDocument;
    changes: Change[];
    assessments: ImpactAssessment[];
    timeline: string[];
  } {
    const doc = this.evolution_docs.get(evolutionDocId);
    if (!doc) {
      throw new Error(`Evolution document not found: ${evolutionDocId}`);
    }

    const changes = doc.changes
      .map((changeId) => this.changes.get(changeId as unknown as string))
      .filter(Boolean) as Change[];

    const assessments = doc.changes
      .map((changeId) => this.impact_assessments.get(changeId as unknown as string))
      .filter(Boolean) as ImpactAssessment[];

    const timeline = doc.audit_trail.map(
      (entry) => `${entry.timestamp}: ${entry.action} by ${entry.actor}`
    );

    return {
      doc,
      changes,
      assessments,
      timeline,
    };
  }

  /**
   * Get changes by resource type
   */
  public getChangesByResourceType(resourceType: ResourceType): Change[] {
    return Array.from(this.changes.values()).filter(
      (c) => c.resource_type === resourceType
    );
  }

  /**
   * Get high-risk changes
   */
  public getHighRiskChanges(): Array<Change & { risk_level: string }> {
    const highRisk: Array<Change & { risk_level: string }> = [];

    for (const change of this.changes.values()) {
      const assessment = this.impact_assessments.get(change.id);
      if (
        assessment &&
        (assessment.risk_level === "high" || assessment.risk_level === "critical")
      ) {
        highRisk.push({
          ...change,
          risk_level: assessment.risk_level,
        });
      }
    }

    return highRisk;
  }

  /**
   * Get taxonomy events
   */
  public getTaxonomyEvents(
    filter?: Partial<TaxonomyChangeEvent>
  ): TaxonomyChangeEvent[] {
    if (!filter) {
      return [...this.taxonomy_events];
    }

    return this.taxonomy_events.filter((event) => {
      for (const [key, value] of Object.entries(filter)) {
        if (event[key as keyof TaxonomyChangeEvent] !== value) {
          return false;
        }
      }
      return true;
    });
  }

  /**
   * Get change log
   */
  public getChangeLog(): Array<{
    timestamp: string;
    action: string;
    doc_id: string;
    change_id?: string;
    details: Record<string, unknown>;
    actor: string;
  }> {
    return [...this.change_log];
  }

  /**
   * Export evolution data
   */
  public exportEvolutionData(): {
    evolution_docs: EvolutionDocument[];
    changes: Change[];
    assessments: ImpactAssessment[];
    taxonomy_events: TaxonomyChangeEvent[];
  } {
    return {
      evolution_docs: Array.from(this.evolution_docs.values()),
      changes: Array.from(this.changes.values()),
      assessments: Array.from(this.impact_assessments.values()),
      taxonomy_events: [...this.taxonomy_events],
    };
  }

  /**
   * Validate evolution consistency
   */
  public validateEvolution(docId: string): { valid: boolean; errors: string[] } {
    const doc = this.evolution_docs.get(docId);
    if (!doc) {
      return { valid: false, errors: [`Evolution document not found: ${docId}`] };
    }

    const errors: string[] = [];

    if (!doc.title || doc.title.length < 5) {
      errors.push("Document title must be at least 5 characters");
    }

    if (doc.objectives.length === 0) {
      errors.push("Document must have at least one objective");
    }

    if (doc.success_criteria.length === 0) {
      errors.push("Document must have at least one success criterion");
    }

    if (doc.team.contributors.length === 0) {
      errors.push("Document must have at least one contributor");
    }

    // Check all linked changes exist
    for (const changeId of doc.changes) {
      if (!this.changes.has(changeId as unknown as string)) {
        errors.push(`Referenced change not found: ${changeId}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Export default instance
export const evolutionSync = new EvolutionSync();
