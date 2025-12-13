// src/types/events.ts
// Multi-agent event schema definitions for type-safe event routing

/**
 * Base event interface with common fields
 */
export interface BaseEvent {
  eventId: string;
  timestamp: string;
  source: string;
  correlationId?: string;
}

/**
 * GitHub webhook event payload
 */
export interface GithubEventPayload extends BaseEvent {
  source: "github";
  action: "push" | "pull_request" | "issue" | "workflow_run" | "release";
  repository: {
    owner: string;
    name: string;
    fullName: string;
  };
  ref?: string;
  sender: {
    login: string;
    id: number;
  };
  payload: Record<string, unknown>;
}

/**
 * Gemini agent event payload
 */
export interface GeminiEventPayload extends BaseEvent {
  source: "gemini";
  action: "generate" | "analyze" | "optimize";
  prompt: string;
  context?: Record<string, unknown>;
  model?: string;
  maxTokens?: number;
}

/**
 * ChatGPT agent event payload
 */
export interface ChatGPTEventPayload extends BaseEvent {
  source: "chatgpt";
  action: "generate" | "review" | "refactor";
  prompt: string;
  context?: Record<string, unknown>;
  model?: string;
  temperature?: number;
}

/**
 * Hostinger deployment event payload
 */
export interface HostingerEventPayload extends BaseEvent {
  source: "hostinger";
  action: "deploy" | "rollback" | "health_check";
  environment: "staging" | "production";
  deploymentId?: string;
  config?: Record<string, unknown>;
}

/**
 * Vault secret rotation event
 */
export interface VaultRotationEventPayload extends BaseEvent {
  source: "vault";
  action: "secret_rotated" | "token_renewed" | "policy_updated";
  path: string;
  version?: number;
  operation: "create" | "update" | "delete";
}

/**
 * Mobile API command event
 */
export interface MobileCommandEventPayload extends BaseEvent {
  source: "mobile";
  action: "execute" | "status" | "sync";
  command: string;
  params?: Record<string, unknown>;
  userId?: string;
}

/**
 * Orchestrator internal event
 */
export interface OrchestratorEventPayload extends BaseEvent {
  source: "orchestrator";
  action: "job_started" | "job_completed" | "job_failed";
  jobId: string;
  jobType: string;
  status: "pending" | "running" | "completed" | "failed";
  error?: string;
}

/**
 * Union type of all event payloads
 */
export type EventPayload =
  | GithubEventPayload
  | GeminiEventPayload
  | ChatGPTEventPayload
  | HostingerEventPayload
  | VaultRotationEventPayload
  | MobileCommandEventPayload
  | OrchestratorEventPayload;

/**
 * Event envelope for Redis pub/sub
 */
export interface EventEnvelope {
  channel: string;
  event: EventPayload;
  metadata?: {
    retryCount?: number;
    priority?: "low" | "medium" | "high" | "critical";
    ttl?: number;
  };
}

/**
 * Type guards for event discrimination
 */
export function isGithubEvent(
  event: EventPayload
): event is GithubEventPayload {
  return event.source === "github";
}

export function isGeminiEvent(
  event: EventPayload
): event is GeminiEventPayload {
  return event.source === "gemini";
}

export function isChatGPTEvent(
  event: EventPayload
): event is ChatGPTEventPayload {
  return event.source === "chatgpt";
}

export function isHostingerEvent(
  event: EventPayload
): event is HostingerEventPayload {
  return event.source === "hostinger";
}

export function isVaultRotationEvent(
  event: EventPayload
): event is VaultRotationEventPayload {
  return event.source === "vault";
}

export function isMobileCommandEvent(
  event: EventPayload
): event is MobileCommandEventPayload {
  return event.source === "mobile";
}

export function isOrchestratorEvent(
  event: EventPayload
): event is OrchestratorEventPayload {
  return event.source === "orchestrator";
}
