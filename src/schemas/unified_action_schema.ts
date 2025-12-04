/**
 * Unified Action Schema (UAS) - TypeScript Implementation
 * Core protocol for Intelligence-to-Code Pipeline
 * Defines mandatory I/O format for all AI → Copilot → Cloud communication
 * Version: 1.0.0
 */

import { v4 as uuidv4 } from "uuid";

/**
 * Task lifecycle states
 */
export enum TaskStatus {
  PENDING = "pending",
  PLANNING = "planning",
  EXECUTING = "executing",
  VALIDATING = "validating",
  DEPLOYED = "deployed",
  HEALED = "healed",
  FAILED = "failed",
}

/**
 * Priority levels for task execution
 */
export enum Priority {
  CRITICAL = "critical",
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}

/**
 * Metadata envelope for all UAS messages
 */
export interface UASMetadata {
  task_id: string;
  timestamp: string;
  version: string;
  orchestrator: string;
  executor: string;
  priority?: Priority;
}

/**
 * Execution context and constraints
 */
export interface UASContext {
  repository: string;
  branch: string;
  target_env: "development" | "staging" | "production";
  constraints?: Record<string, unknown>;
  dependencies?: string[];
}

/**
 * Core task specification
 */
export interface UASPayload {
  sgp: string; // Semantic Goal Prompt
  objective: string;
  description: string;
  acceptance_criteria: string[];
  estimated_tokens?: number;
  required_skills?: string[];
}

/**
 * Generated code/artifact specification
 */
export interface UASDeliverable {
  file_path: string;
  content: string;
  file_type:
    | "python"
    | "typescript"
    | "yaml"
    | "json"
    | "javascript"
    | "dockerfile";
  checksum?: string;
  dependencies?: string[];
}

/**
 * Security & governance validation results
 */
export interface UASGovernance {
  security_check: boolean;
  schema_validation: boolean;
  compliance_rules: Record<string, boolean>;
  governance_signature?: string;
  approved_by?: string;
}

/**
 * Deployment and execution tracking
 */
export interface UASExecution {
  deployment_target: string;
  deployment_method: "railway" | "aws" | "azure" | "gcp" | "k8s";
  status: TaskStatus;
  logs?: string[];
  error_message?: string;
  deployed_at?: string;
}

/**
 * Complete Unified Action Schema message
 */
export interface UASMessage {
  metadata: UASMetadata;
  context: UASContext;
  payload: UASPayload;
  deliverables: UASDeliverable[];
  governance: UASGovernance;
  execution: UASExecution;
}

/**
 * Factory function to create a new UAS task
 */
export function createUASTask(
  sgp: string,
  objective: string,
  repository: string,
  acceptance_criteria: string[],
  deployment_target: string = "railway"
): UASMessage {
  const now = new Date().toISOString();
  const task_id = `task-${uuidv4().substring(0, 8)}`;

  return {
    metadata: {
      task_id,
      timestamp: now,
      version: "1.0.0",
      orchestrator: "gemini",
      executor: "copilot",
      priority: Priority.HIGH,
    },
    context: {
      repository,
      branch: "main",
      target_env: "development",
    },
    payload: {
      sgp,
      objective,
      description: `Task: ${objective}`,
      acceptance_criteria,
    },
    deliverables: [],
    governance: {
      security_check: false,
      schema_validation: false,
      compliance_rules: {},
    },
    execution: {
      deployment_target,
      deployment_method: "railway",
      status: TaskStatus.PENDING,
    },
  };
}

/**
 * Validate a UAS message structure
 */
export function validateUAS(message: UASMessage): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!message.metadata?.task_id) {
    errors.push("Missing metadata.task_id");
  }

  if (!message.context?.repository) {
    errors.push("Missing context.repository");
  }

  if (!message.payload?.objective) {
    errors.push("Missing payload.objective");
  }

  if (!Array.isArray(message.payload?.acceptance_criteria)) {
    errors.push("Missing or invalid payload.acceptance_criteria");
  }

  if (!message.execution?.deployment_target) {
    errors.push("Missing execution.deployment_target");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Serialize UAS message to JSON
 */
export function uasToJSON(message: UASMessage): string {
  return JSON.stringify(message, null, 2);
}

/**
 * Deserialize UAS message from JSON
 */
export function uasFromJSON(json: string): UASMessage {
  const parsed = JSON.parse(json);

  // Ensure status enum is properly typed
  if (typeof parsed.execution.status === "string") {
    parsed.execution.status = parsed.execution.status as TaskStatus;
  }

  return parsed as UASMessage;
}

/**
 * Create a UAS response for governance validation
 */
export function createGovernanceResponse(
  originalTask: UASMessage,
  approved: boolean,
  signature?: string
): UASMessage {
  return {
    ...originalTask,
    governance: {
      ...originalTask.governance,
      security_check: approved,
      schema_validation: approved,
      governance_signature: signature,
      approved_by: approved ? "gemini" : undefined,
    },
  };
}

export default UASMessage;
