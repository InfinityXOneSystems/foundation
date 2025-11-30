/**
 * Enterprise SOP Management System
 * Full CRUD, tagging, categorization, compliance, audit trails
 * 
 * @package sop
 * @author JARVIS
 * @version 1.0.0
 */

import { EventEmitter } from "events";

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export type SOPStatus = "draft" | "review" | "approved" | "active" | "archived" | "deprecated";
export type SOPPriority = "low" | "medium" | "high" | "critical";
export type SOPCategory = "operational" | "security" | "compliance" | "incident-response" | "deployment" | "maintenance" | "integration";
export type ApprovalStatus = "pending" | "approved" | "rejected" | "requires-revision";

/**
 * SOP step definition
 */
export interface SOPStep {
  step_number: number;
  title: string;
  description: string;
  instructions: string[];
  preconditions: string[];
  postconditions: string[];
  estimated_time_minutes: number;
  responsible_role: string;
  validation_criteria: string[];
  rollback_instructions?: string[];
}

/**
 * SOP approval record
 */
export interface ApprovalRecord {
  approver_id: string;
  approver_name: string;
  status: ApprovalStatus;
  approved_at?: string;
  comments: string;
  revision_number: number;
}

/**
 * SOP compliance mapping
 */
export interface ComplianceMapping {
  standard: string;
  requirement_id: string;
  requirement_text: string;
  mapped_steps: number[];
  verified: boolean;
  verified_by?: string;
  verified_at?: string;
}

/**
 * SOP document
 */
export interface SOP {
  id: string;
  title: string;
  description: string;
  category: SOPCategory;
  status: SOPStatus;
  priority: SOPPriority;
  version: string;
  revision_number: number;
  steps: SOPStep[];
  tags: string[];
  related_sops: string[];
  prerequisites: string[];
  estimated_total_time_minutes: number;
  responsible_team: string;
  approval_required: boolean;
  approvals: ApprovalRecord[];
  compliance_mappings: ComplianceMapping[];
  metadata: {
    created_at: string;
    created_by: string;
    updated_at: string;
    updated_by: string;
    last_executed_at?: string;
    last_executed_by?: string;
    execution_count: number;
    failure_count: number;
    success_rate: number;
  };
  references: {
    documentation_links: string[];
    tool_links: string[];
    script_paths: string[];
  };
  notes: string[];
  audit_trail: Array<{
    timestamp: string;
    action: string;
    actor: string;
    changes: Record<string, unknown>;
  }>;
}

/**
 * SOP execution record
 */
export interface SOPExecution {
  execution_id: string;
  sop_id: string;
  executed_by: string;
  execution_status: "in_progress" | "completed" | "failed" | "partially_completed";
  started_at: string;
  completed_at?: string;
  total_time_minutes?: number;
  step_results: Array<{
    step_number: number;
    status: "pending" | "in_progress" | "completed" | "failed" | "skipped";
    started_at?: string;
    completed_at?: string;
    duration_minutes?: number;
    notes: string;
    validation_results: Record<string, boolean>;
  }>;
  issues_encountered: string[];
  rollbacks_performed: number[];
  approvals_obtained: string[];
  created_at: string;
}

// ============================================================
// SOP MANAGEMENT SYSTEM
// ============================================================

export class SOPSystem extends EventEmitter {
  private sops: Map<string, SOP>;
  private executions: Map<string, SOPExecution>;
  private execution_history: Map<string, SOPExecution[]>;
  private sop_index: Map<string, Set<string>>;
  private audit_log: Array<{
    timestamp: string;
    action: string;
    sop_id: string;
    execution_id?: string;
    details: Record<string, unknown>;
    actor: string;
  }>;

  constructor() {
    super();
    this.sops = new Map();
    this.executions = new Map();
    this.execution_history = new Map();
    this.sop_index = new Map();
    this.audit_log = [];

    this.initializeSearchIndexes();
  }

  /**
   * Initialize search indexes for quick lookups
   */
  private initializeSearchIndexes(): void {
    const indexes = ["category", "status", "priority", "tag", "team"];
    for (const index of indexes) {
      this.sop_index.set(index, new Set());
    }
  }

  /**
   * Create new SOP
   */
  public createSOP(
    id: string,
    title: string,
    description: string,
    category: SOPCategory,
    priority: SOPPriority,
    steps: SOPStep[],
    creator: string,
    requiresApproval = true,
    tags: string[] = [],
    relatedSOPs: string[] = []
  ): SOP {
    if (this.sops.has(id)) {
      throw new Error(`SOP already exists: ${id}`);
    }

    const now = new Date().toISOString();

    const sop: SOP = {
      id,
      title,
      description,
      category,
      status: "draft",
      priority,
      version: "1.0.0",
      revision_number: 1,
      steps,
      tags,
      related_sops: relatedSOPs,
      prerequisites: [],
      estimated_total_time_minutes: steps.reduce((sum, s) => sum + s.estimated_time_minutes, 0),
      responsible_team: "",
      approval_required: requiresApproval,
      approvals: [],
      compliance_mappings: [],
      metadata: {
        created_at: now,
        created_by: creator,
        updated_at: now,
        updated_by: creator,
        execution_count: 0,
        failure_count: 0,
        success_rate: 0,
      },
      references: {
        documentation_links: [],
        tool_links: [],
        script_paths: [],
      },
      notes: [],
      audit_trail: [
        {
          timestamp: now,
          action: "created",
          actor: creator,
          changes: { initial: true },
        },
      ],
    };

    this.sops.set(id, sop);
    this.execution_history.set(id, []);

    // Update indexes
    const categoryKey = `category:${category}`;
    const priorityKey = `priority:${priority}`;

    this.sop_index.get("category")?.add(categoryKey);
    this.sop_index.get("priority")?.add(priorityKey);

    for (const tag of tags) {
      const tagKey = `tag:${tag}`;
      this.sop_index.get("tag")?.add(tagKey);
    }

    this.audit_log.push({
      timestamp: now,
      action: "sop_created",
      sop_id: id,
      details: { title, category, priority },
      actor: creator,
    });

    this.emit("sop_created", sop);

    return sop;
  }

  /**
   * Update SOP
   */
  public updateSOP(
    sopId: string,
    updates: Partial<SOP>,
    updater: string
  ): SOP {
    const sop = this.sops.get(sopId);
    if (!sop) {
      throw new Error(`SOP not found: ${sopId}`);
    }

    const before = JSON.parse(JSON.stringify(sop));
    const now = new Date().toISOString();

    // Apply updates
    Object.assign(sop, updates);

    // Bump revision
    if (updates.steps || updates.status) {
      sop.revision_number += 1;
      const parts = sop.version.split(".");
      const minorVersion = parts[1] || "0";
      parts[1] = String(parseInt(minorVersion) + 1);
      sop.version = parts.join(".");
    }

    sop.metadata.updated_at = now;
    sop.metadata.updated_by = updater;

    sop.audit_trail.push({
      timestamp: now,
      action: "updated",
      actor: updater,
      changes: updates,
    });

    this.audit_log.push({
      timestamp: now,
      action: "sop_updated",
      sop_id: sopId,
      details: { before, after: sop },
      actor: updater,
    });

    this.emit("sop_updated", sop);

    return sop;
  }

  /**
   * Request SOP approval
   */
  public requestApproval(
    sopId: string,
    requestor: string,
    requiredApprovals = 2
  ): SOP {
    const sop = this.sops.get(sopId);
    if (!sop) {
      throw new Error(`SOP not found: ${sopId}`);
    }

    if (sop.status !== "draft") {
      throw new Error(`Cannot request approval for SOP in ${sop.status} status`);
    }

    sop.status = "review";
    sop.approval_required = true;

    // Initialize approval records
    sop.approvals = Array(requiredApprovals)
      .fill(0)
      .map((_, i) => ({
        approver_id: `approver_${i + 1}`,
        approver_name: `Approver ${i + 1}`,
        status: "pending" as ApprovalStatus,
        comments: "",
        revision_number: sop.revision_number,
      }));

    const now = new Date().toISOString();
    sop.audit_trail.push({
      timestamp: now,
      action: "approval_requested",
      actor: requestor,
      changes: { required_approvals: requiredApprovals },
    });

    this.audit_log.push({
      timestamp: now,
      action: "approval_requested",
      sop_id: sopId,
      details: { required_approvals: requiredApprovals },
      actor: requestor,
    });

    this.emit("approval_requested", sop);

    return sop;
  }

  /**
   * Approve SOP
   */
  public approveSOP(
    sopId: string,
    approverId: string,
    approverName: string,
    comments = ""
  ): SOP {
    const sop = this.sops.get(sopId);
    if (!sop) {
      throw new Error(`SOP not found: ${sopId}`);
    }

    if (sop.status !== "review") {
      throw new Error(`Cannot approve SOP in ${sop.status} status`);
    }

    // Find and update approval record
    const approval = sop.approvals.find((a) => a.approver_id === approverId);
    if (approval) {
      approval.status = "approved";
      approval.comments = comments;
      approval.approved_at = new Date().toISOString();
    }

    // Check if all approvals obtained
    const allApproved = sop.approvals.every((a) => a.status === "approved");

    if (allApproved) {
      sop.status = "approved";
      this.emit("sop_approved", sop);
    }

    const now = new Date().toISOString();
    sop.audit_trail.push({
      timestamp: now,
      action: "approved",
      actor: approverId,
      changes: { approver: approverName, comments },
    });

    this.audit_log.push({
      timestamp: now,
      action: "sop_approved",
      sop_id: sopId,
      details: { approver: approverName },
      actor: approverId,
    });

    this.emit("approval_recorded", sop);

    return sop;
  }

  /**
   * Publish SOP (move to active)
   */
  public publishSOP(sopId: string, publisher: string): SOP {
    const sop = this.sops.get(sopId);
    if (!sop) {
      throw new Error(`SOP not found: ${sopId}`);
    }

    if (sop.status !== "approved") {
      throw new Error(`Can only publish approved SOPs (current: ${sop.status})`);
    }

    sop.status = "active";

    const now = new Date().toISOString();
    sop.audit_trail.push({
      timestamp: now,
      action: "published",
      actor: publisher,
      changes: { status: "active" },
    });

    this.audit_log.push({
      timestamp: now,
      action: "sop_published",
      sop_id: sopId,
      details: {},
      actor: publisher,
    });

    this.emit("sop_published", sop);

    return sop;
  }

  /**
   * Start SOP execution
   */
  public startExecution(
    sopId: string,
    executor: string
  ): SOPExecution {
    const sop = this.sops.get(sopId);
    if (!sop) {
      throw new Error(`SOP not found: ${sopId}`);
    }

    if (sop.status !== "active") {
      throw new Error(`Can only execute active SOPs (current: ${sop.status})`);
    }

    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const execution: SOPExecution = {
      execution_id: executionId,
      sop_id: sopId,
      executed_by: executor,
      execution_status: "in_progress",
      started_at: now,
      step_results: sop.steps.map((step) => ({
        step_number: step.step_number,
        status: "pending" as const,
        notes: "",
        validation_results: {},
      })),
      issues_encountered: [],
      rollbacks_performed: [],
      approvals_obtained: [],
      created_at: now,
    };

    this.executions.set(executionId, execution);

    // Add to execution history
    const history = this.execution_history.get(sopId) || [];
    history.push(execution);
    this.execution_history.set(sopId, history);

    this.audit_log.push({
      timestamp: now,
      action: "execution_started",
      sop_id: sopId,
      execution_id: executionId,
      details: { executor },
      actor: executor,
    });

    this.emit("execution_started", execution);

    return execution;
  }

  /**
   * Record step completion
   */
  public completeStep(
    executionId: string,
    stepNumber: number,
    validationResults: Record<string, boolean>,
    notes = "",
    actor: string
  ): SOPExecution {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    const stepResult = execution.step_results.find((sr) => sr.step_number === stepNumber);
    if (!stepResult) {
      throw new Error(`Step not found: ${stepNumber}`);
    }

    const now = new Date().toISOString();
    stepResult.status = "completed";
    stepResult.completed_at = now;
    stepResult.validation_results = validationResults;
    stepResult.notes = notes;

    if (stepResult.started_at) {
      const duration = new Date(now).getTime() - new Date(stepResult.started_at).getTime();
      stepResult.duration_minutes = Math.round(duration / 60000);
    }

    this.audit_log.push({
      timestamp: now,
      action: "step_completed",
      sop_id: execution.sop_id,
      execution_id: executionId,
      details: { step_number: stepNumber, validationResults },
      actor,
    });

    this.emit("step_completed", { executionId, stepNumber, validationResults });

    return execution;
  }

  /**
   * Complete execution
   */
  public completeExecution(
    executionId: string,
    actor: string,
    notes = ""
  ): SOPExecution {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    const now = new Date().toISOString();
    execution.completed_at = now;
    execution.execution_status = "completed";

    const duration = new Date(now).getTime() - new Date(execution.started_at).getTime();
    execution.total_time_minutes = Math.round(duration / 60000);

    // Update SOP execution metrics
    const sop = this.sops.get(execution.sop_id);
    if (sop) {
      sop.metadata.execution_count += 1;
      sop.metadata.last_executed_at = now;
      sop.metadata.last_executed_by = actor;

      const completedSteps = execution.step_results.filter(
        (sr) => sr.status === "completed"
      ).length;
      const totalSteps = execution.step_results.length;

      if (completedSteps === totalSteps) {
        sop.metadata.success_rate = 1.0;
      } else {
        sop.metadata.success_rate = completedSteps / totalSteps;
      }
    }

    this.audit_log.push({
      timestamp: now,
      action: "execution_completed",
      sop_id: execution.sop_id,
      execution_id: executionId,
      details: { total_time_minutes: execution.total_time_minutes, notes },
      actor,
    });

    this.emit("execution_completed", execution);

    return execution;
  }

  /**
   * Get SOP
   */
  public getSOP(sopId: string): SOP | undefined {
    return this.sops.get(sopId);
  }

  /**
   * Search SOPs
   */
  public searchSOPs(query: Record<string, unknown>): SOP[] {
    const results: SOP[] = [];

    for (const sop of this.sops.values()) {
      let matches = true;

      if (query.category && sop.category !== query.category) matches = false;
      if (query.status && sop.status !== query.status) matches = false;
      if (query.priority && sop.priority !== query.priority) matches = false;
      if (
        query.title &&
        !sop.title.toLowerCase().includes((query.title as string).toLowerCase())
      )
        matches = false;
      if (
        query.tag &&
        !sop.tags.includes(query.tag as string)
      )
        matches = false;
      if (query.team && sop.responsible_team !== query.team) matches = false;

      if (matches) {
        results.push(sop);
      }
    }

    return results;
  }

  /**
   * Get execution history for SOP
   */
  public getExecutionHistory(sopId: string): SOPExecution[] {
    return this.execution_history.get(sopId) || [];
  }

  /**
   * Get execution
   */
  public getExecution(executionId: string): SOPExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Add compliance mapping
   */
  public addComplianceMapping(
    sopId: string,
    standard: string,
    requirementId: string,
    requirementText: string,
    mappedSteps: number[],
    actor: string
  ): SOP {
    const sop = this.sops.get(sopId);
    if (!sop) {
      throw new Error(`SOP not found: ${sopId}`);
    }

    sop.compliance_mappings.push({
      standard,
      requirement_id: requirementId,
      requirement_text: requirementText,
      mapped_steps: mappedSteps,
      verified: false,
    });

    const now = new Date().toISOString();
    this.audit_log.push({
      timestamp: now,
      action: "compliance_mapping_added",
      sop_id: sopId,
      details: { standard, requirement_id: requirementId },
      actor,
    });

    this.emit("compliance_mapping_added", sop);

    return sop;
  }

  /**
   * Get audit log
   */
  public getAuditLog(): Array<{
    timestamp: string;
    action: string;
    sop_id: string;
    execution_id?: string;
    details: Record<string, unknown>;
    actor: string;
  }> {
    return [...this.audit_log];
  }

  /**
   * Get SOP statistics
   */
  public getStatistics(): Record<string, unknown> {
    const stats = {
      total_sops: this.sops.size,
      sops_by_status: {} as Record<SOPStatus, number>,
      sops_by_category: {} as Record<SOPCategory, number>,
      sops_by_priority: {} as Record<SOPPriority, number>,
      total_executions: this.executions.size,
      average_execution_time_minutes: 0,
      total_success_rate: 0,
    };

    let totalTime = 0;
    let executionCount = 0;

    for (const sop of this.sops.values()) {
      stats.sops_by_status[sop.status] = (stats.sops_by_status[sop.status] || 0) + 1;
      stats.sops_by_category[sop.category] = (stats.sops_by_category[sop.category] || 0) + 1;
      stats.sops_by_priority[sop.priority] = (stats.sops_by_priority[sop.priority] || 0) + 1;
      totalTime += sop.metadata.execution_count > 0 ? sop.estimated_total_time_minutes : 0;
      executionCount += sop.metadata.execution_count;
    }

    if (this.executions.size > 0) {
      let totalExecutionTime = 0;

      for (const execution of this.executions.values()) {
        if (execution.total_time_minutes) {
          totalExecutionTime += execution.total_time_minutes;
        }
      }

      stats.average_execution_time_minutes = Math.round(totalExecutionTime / this.executions.size);
    }

    stats.total_success_rate = executionCount > 0 ? totalTime / executionCount : 0;

    return stats;
  }

  /**
   * Validate SOP consistency
   */
  public validateSOP(sopId: string): { valid: boolean; errors: string[] } {
    const sop = this.sops.get(sopId);
    if (!sop) {
      return { valid: false, errors: [`SOP not found: ${sopId}`] };
    }

    const errors: string[] = [];

    if (!sop.title || sop.title.length < 5) {
      errors.push("SOP title must be at least 5 characters");
    }

    if (sop.steps.length === 0) {
      errors.push("SOP must have at least one step");
    }

    for (let i = 0; i < sop.steps.length; i++) {
      const step = sop.steps[i];

      if (!step || !step.title || step.title.length < 3) {
        errors.push(`Step ${i + 1}: Title must be at least 3 characters`);
      }

      if (!step || step.instructions.length === 0) {
        errors.push(`Step ${i + 1}: Must have at least one instruction`);
      }

      if (!step || step.responsible_role.length === 0) {
        errors.push(`Step ${i + 1}: Missing responsible role`);
      }
    }

    // Check related SOPs exist
    for (const relatedId of sop.related_sops) {
      if (!this.sops.has(relatedId)) {
        errors.push(`Referenced SOP not found: ${relatedId}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Export default instance
export const sopSystem = new SOPSystem();
