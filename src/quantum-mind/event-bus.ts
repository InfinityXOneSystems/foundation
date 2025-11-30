/**
 * Quantum Mind Event Bus
 * Real-time event streaming and pub/sub architecture
 * Connects all agents, taxonomy, ingestion, and external platforms
 * 
 * @package quantum-mind
 * @author JARVIS
 * @version 1.0.0
 */

import { EventEmitter } from "events";

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export type EventPriority = "critical" | "high" | "medium" | "low";
export type EventSource = 
  | "ingestion_agent" 
  | "vision_agent" 
  | "strategy_agent" 
  | "validation_agent" 
  | "document_agent"
  | "taxonomy_system"
  | "crawler_system"
  | "chatgpt_platform"
  | "gemini_platform"
  | "google_platform"
  | "github_platform"
  | "file_watcher"
  | "unified_brain"
  | "memory_system";

export interface QuantumEvent {
  id: string;
  timestamp: string;
  source: EventSource;
  event_type: string;
  priority: EventPriority;
  payload: Record<string, unknown>;
  metadata: {
    agent_id?: string;
    session_id?: string;
    trace_id?: string;
    requires_response?: boolean;
    response_timeout_ms?: number;
  };
}

export interface EventSubscription {
  id: string;
  subscriber_id: string;
  event_types: string[];
  sources: EventSource[];
  priority_filter?: EventPriority[];
  callback: (event: QuantumEvent) => void | Promise<void>;
  created_at: string;
}

export interface EventLog {
  event: QuantumEvent;
  delivered_to: string[];
  processing_time_ms: number;
  errors: Array<{
    subscriber_id: string;
    error: string;
  }>;
}

// ============================================================
// QUANTUM MIND EVENT BUS
// ============================================================

export class QuantumEventBus extends EventEmitter {
  private subscriptions: Map<string, EventSubscription> = new Map();
  private event_log: EventLog[] = [];
  private event_queue: QuantumEvent[] = [];
  private processing: boolean = false;
  private metrics: {
    total_events: number;
    events_by_source: Record<EventSource, number>;
    events_by_type: Record<string, number>;
    average_processing_ms: number;
    failed_deliveries: number;
  } = {
    total_events: 0,
    events_by_source: {} as Record<EventSource, number>,
    events_by_type: {},
    average_processing_ms: 0,
    failed_deliveries: 0,
  };

  constructor() {
    super();
    this.setMaxListeners(100); // Support many subscribers
    this.startProcessing();
  }

  /**
   * Publish event to the bus
   */
  public publish(
    source: EventSource,
    event_type: string,
    payload: Record<string, unknown>,
    priority: EventPriority = "medium",
    metadata: QuantumEvent["metadata"] = {}
  ): string {
    const event: QuantumEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      source,
      event_type,
      priority,
      payload,
      metadata,
    };

    // Add to queue based on priority
    if (priority === "critical") {
      this.event_queue.unshift(event);
    } else {
      this.event_queue.push(event);
    }

    // Update metrics
    this.metrics.total_events++;
    this.metrics.events_by_source[source] = (this.metrics.events_by_source[source] || 0) + 1;
    this.metrics.events_by_type[event_type] = (this.metrics.events_by_type[event_type] || 0) + 1;

    this.emit("event_published", event);

    return event.id;
  }

  /**
   * Subscribe to events
   */
  public subscribe(
    subscriber_id: string,
    event_types: string[],
    sources: EventSource[],
    callback: (event: QuantumEvent) => void | Promise<void>,
    priority_filter?: EventPriority[]
  ): string {
    const subscription = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      subscriber_id,
      event_types,
      sources,
      ...(priority_filter ? { priority_filter } : {}),
      callback,
      created_at: new Date().toISOString(),
    } as EventSubscription;

    this.subscriptions.set(subscription.id, subscription);

    this.emit("subscription_created", { subscription_id: subscription.id, subscriber_id });

    return subscription.id;
  }

  /**
   * Unsubscribe from events
   */
  public unsubscribe(subscription_id: string): boolean {
    const deleted = this.subscriptions.delete(subscription_id);
    if (deleted) {
      this.emit("subscription_removed", { subscription_id });
    }
    return deleted;
  }

  /**
   * Process event queue
   */
  private async startProcessing(): Promise<void> {
    this.processing = true;

    while (this.processing) {
      if (this.event_queue.length > 0) {
        const event = this.event_queue.shift();
        if (event) {
          await this.processEvent(event);
        }
      } else {
        // Sleep for 10ms if queue is empty
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }
  }

  /**
   * Process individual event
   */
  private async processEvent(event: QuantumEvent): Promise<void> {
    const start_time = Date.now();
    const delivered_to: string[] = [];
    const errors: Array<{ subscriber_id: string; error: string }> = [];

    // Find matching subscriptions
    const matching_subscriptions = Array.from(this.subscriptions.values()).filter((sub) => {
      const type_match = sub.event_types.includes("*") || sub.event_types.includes(event.event_type);
      const source_match = sub.sources.includes(event.source);
      const priority_match = !sub.priority_filter || sub.priority_filter.includes(event.priority);

      return type_match && source_match && priority_match;
    });

    // Deliver to subscribers
    await Promise.all(
      matching_subscriptions.map(async (sub) => {
        try {
          await sub.callback(event);
          delivered_to.push(sub.subscriber_id);
        } catch (error) {
          const err_msg = error instanceof Error ? error.message : String(error);
          errors.push({
            subscriber_id: sub.subscriber_id,
            error: err_msg,
          });
          this.metrics.failed_deliveries++;
        }
      })
    );

    const processing_time = Date.now() - start_time;

    // Log event
    const log: EventLog = {
      event,
      delivered_to,
      processing_time_ms: processing_time,
      errors,
    };

    this.event_log.push(log);

    // Update average processing time
    const total_time = this.metrics.average_processing_ms * (this.metrics.total_events - 1) + processing_time;
    this.metrics.average_processing_ms = total_time / this.metrics.total_events;

    this.emit("event_processed", log);
  }

  /**
   * Get event logs
   */
  public getEventLogs(filter?: {
    source?: EventSource;
    event_type?: string;
    since?: string;
    limit?: number;
  }): EventLog[] {
    let logs = [...this.event_log];

    if (filter) {
      if (filter.source) {
        logs = logs.filter((log) => log.event.source === filter.source);
      }
      if (filter.event_type) {
        logs = logs.filter((log) => log.event.event_type === filter.event_type);
      }
      if (filter.since) {
        logs = logs.filter((log) => log.event.timestamp >= filter.since!);
      }
      if (filter.limit) {
        logs = logs.slice(-filter.limit);
      }
    }

    return logs;
  }

  /**
   * Get metrics
   */
  public getMetrics(): typeof this.metrics {
    return { ...this.metrics };
  }

  /**
   * Clear event logs
   */
  public clearLogs(older_than?: string): number {
    if (older_than) {
      const initial_count = this.event_log.length;
      this.event_log = this.event_log.filter((log) => log.event.timestamp >= older_than);
      return initial_count - this.event_log.length;
    } else {
      const count = this.event_log.length;
      this.event_log = [];
      return count;
    }
  }

  /**
   * Stop processing
   */
  public stop(): void {
    this.processing = false;
  }

  /**
   * Get active subscriptions
   */
  public getSubscriptions(): EventSubscription[] {
    return Array.from(this.subscriptions.values());
  }
}

// Export singleton instance
export const quantumEventBus = new QuantumEventBus();
