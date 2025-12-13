/**
 * P1.4: REDIS EVENT BUS - DECOUPLE ORCHESTRATOR
 *
 * Replaces direct HTTP calls with asynchronous event-driven architecture
 * Eliminates foundation orchestrator as single point of failure
 */

import { EventEmitter } from "events";
import Redis from "ioredis";
import { createLogger } from "./centralized-logger";

const logger = createLogger("redis-event-bus");

export interface EventBusConfig {
  redis_url: string;
  service_name: string;
}

export interface SystemEvent {
  event_type: string;
  payload: any;
  timestamp: string;
  source_service: string;
  correlation_id?: string;
  trace_id?: string;
}

/**
 * Redis Event Bus for decoupled microservice communication
 */
export class RedisEventBus extends EventEmitter {
  private publisher: Redis;
  private subscriber: Redis;
  private serviceName: string;
  private subscriptions: Map<string, (event: SystemEvent) => void> = new Map();

  constructor(config: EventBusConfig) {
    super();
    this.serviceName = config.service_name;

    // Create separate Redis clients for pub/sub
    this.publisher = new Redis(config.redis_url, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    });

    this.subscriber = new Redis(config.redis_url, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    });

    this.setupErrorHandlers();
  }

  private setupErrorHandlers() {
    this.publisher.on("error", (err) => {
      logger.error("Redis publisher error", err);
    });

    this.subscriber.on("error", (err) => {
      logger.error("Redis subscriber error", err);
    });

    this.subscriber.on("message", (channel, message) => {
      this.handleMessage(channel, message);
    });
  }

  /**
   * Connect to Redis
   */
  public async connect(): Promise<void> {
    await this.publisher.connect();
    await this.subscriber.connect();
    logger.info("Redis Event Bus connected", {
      service: this.serviceName,
    });
  }

  /**
   * Publish event to a channel
   */
  public async publish(
    channel: string,
    eventType: string,
    payload: any,
    correlationId?: string
  ): Promise<void> {
    const event: SystemEvent = {
      event_type: eventType,
      payload,
      timestamp: new Date().toISOString(),
      source_service: this.serviceName,
      ...(correlationId && { correlation_id: correlationId }),
    };

    const message = JSON.stringify(event);
    await this.publisher.publish(channel, message);

    logger.info("Event published", {
      channel,
      event_type: eventType,
      correlation_id: correlationId,
    });
  }

  /**
   * Subscribe to a channel
   */
  public async subscribe(
    channel: string,
    handler: (event: SystemEvent) => void
  ): Promise<void> {
    await this.subscriber.subscribe(channel);
    this.subscriptions.set(channel, handler);

    logger.info("Subscribed to channel", {
      channel,
      service: this.serviceName,
    });
  }

  /**
   * Unsubscribe from a channel
   */
  public async unsubscribe(channel: string): Promise<void> {
    await this.subscriber.unsubscribe(channel);
    this.subscriptions.delete(channel);

    logger.info("Unsubscribed from channel", { channel });
  }

  /**
   * Handle incoming message
   */
  private handleMessage(channel: string, message: string): void {
    try {
      const event: SystemEvent = JSON.parse(message);
      const handler = this.subscriptions.get(channel);

      if (handler) {
        handler(event);
        this.emit("message", { channel, event });
      }

      logger.debug("Event received", {
        channel,
        event_type: event.event_type,
        source: event.source_service,
      });
    } catch (error) {
      logger.error("Failed to handle message", error as Error, {
        channel,
        message,
      });
    }
  }

  /**
   * Disconnect from Redis
   */
  public async disconnect(): Promise<void> {
    await this.publisher.quit();
    await this.subscriber.quit();
    logger.info("Redis Event Bus disconnected");
  }
}

/**
 * Event channel constants
 */
export const EventChannels = {
  // OSINT Events
  OSINT_CRAWL_COMPLETE: "osint:crawl-complete",
  OSINT_NEW_DOCUMENT: "osint:new-document",

  // Taxonomy Events
  TAXONOMY_UPDATE: "taxonomy:update",
  TAXONOMY_ALCHEMY_COMPLETE: "taxonomy:alchemy-complete",
  TAXONOMY_MODEL_CARD_UPDATED: "taxonomy:model-card-updated",

  // Auto-Builder Events
  BUILDER_TRIGGERED: "builder:triggered",
  BUILDER_COMPLETE: "builder:complete",
  BUILDER_FAILED: "builder:failed",
  BUILDER_DEPLOY_START: "builder:deploy-start",
  BUILDER_DEPLOY_COMPLETE: "builder:deploy-complete",

  // Auto-Heal Events
  DIAGNOSTICS_START: "system:diagnostics:start",
  ISSUE_DETECTED: "system:issue-detected",
  ISSUE_FIXED: "system:issue-fixed",
  STAGING_REQUIRED: "system:staging-required",

  // Doc Processing Events
  DOC_INGESTED: "doc:ingested",
  DOC_TRANSFORMED: "doc:transformed",
  DOC_SYNCED: "doc:synced",

  // System Events
  SYSTEM_HEALTH_CHECK: "system:health-check",
  DATA_CONTRACT_VIOLATION: "system:data-contract-violation",
} as const;

/**
 * Type-safe event payloads
 */
export interface EventPayloads {
  [EventChannels.OSINT_NEW_DOCUMENT]: {
    document_id: string;
    source: string;
    artifact_path: string;
  };
  [EventChannels.TAXONOMY_MODEL_CARD_UPDATED]: {
    model_id: string;
    provider: string;
    card_path: string;
  };
  [EventChannels.BUILDER_TRIGGERED]: {
    prompt: string;
    intent: string;
    target: string;
  };
  [EventChannels.ISSUE_DETECTED]: {
    issue_id: string;
    severity: "critical" | "high" | "medium" | "low";
    component: string;
    confidence: number;
  };
  [EventChannels.DATA_CONTRACT_VIOLATION]: {
    source: string;
    document_id: string;
    errors: Array<{ path: string[]; message: string }>;
  };
}
