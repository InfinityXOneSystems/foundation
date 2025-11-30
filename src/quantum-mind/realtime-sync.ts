/**
 * Real-Time Sync System
 * File watchers, taxonomy sync, evolution tracking, data streaming
 * 
 * @package quantum-mind
 * @author JARVIS
 * @version 1.0.0
 */

import { EventEmitter } from "events";
import { watch, FSWatcher } from "fs";
import { quantumEventBus } from "./event-bus";
import { unifiedBrain } from "./unified-brain";
import { googleDriveSync, googleCloudStorage } from "./google-cloud";
import { EnterpriseTaxonomy } from "../taxonomy/enterprise-taxonomy";
import { AzureTaxonomy } from "../taxonomy/azure-taxonomy";
// import { SOPManager } from "../sop/sop-manager"; // TODO: Fix when SOPManager is exported

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export type WatchTarget = "taxonomy" | "sop" | "memory" | "config" | "artifacts";
export type SyncDirection = "local_to_cloud" | "cloud_to_local" | "bidirectional";

export interface FileWatchConfig {
  id: string;
  target: WatchTarget;
  path: string;
  recursive: boolean;
  sync_direction: SyncDirection;
  debounce_ms: number;
  enabled: boolean;
}

export interface SyncEvent {
  id: string;
  timestamp: string;
  source: "file_system" | "taxonomy" | "cloud" | "event_bus";
  target: WatchTarget;
  operation: "create" | "update" | "delete";
  path?: string;
  data: Record<string, unknown>;
  synced_to_cloud: boolean;
}

// ============================================================
// FILE WATCHER SYSTEM
// ============================================================

export class FileWatcherSystem extends EventEmitter {
  private watchers: Map<string, FSWatcher> = new Map();
  private watch_configs: Map<string, FileWatchConfig> = new Map();
  private debounce_timers: Map<string, NodeJS.Timeout> = new Map();
  private sync_events: SyncEvent[] = [];

  constructor() {
    super();
  }

  /**
   * Add file watcher
   */
  public addWatcher(config: FileWatchConfig): string {
    if (this.watch_configs.has(config.id)) {
      throw new Error(`Watcher ${config.id} already exists`);
    }

    this.watch_configs.set(config.id, config);

    if (config.enabled) {
      this.startWatcher(config.id);
    }

    this.emit("watcher_added", { config_id: config.id });

    return config.id;
  }

  /**
   * Start watcher
   */
  private startWatcher(config_id: string): void {
    const config = this.watch_configs.get(config_id);
    if (!config) return;

    try {
      const watcher = watch(
        config.path,
        { recursive: config.recursive },
        (eventType, filename) => {
          this.handleFileChange(config_id, eventType, filename);
        }
      );

      this.watchers.set(config_id, watcher);

      this.emit("watcher_started", { config_id });

      // Publish to event bus
      quantumEventBus.publish(
        "file_watcher",
        "watcher_started",
        {
          config_id,
          path: config.path,
          target: config.target,
        },
        "low"
      );
    } catch (error) {
      const err_msg = error instanceof Error ? error.message : String(error);
      this.emit("watcher_error", { config_id, error: err_msg });
    }
  }

  /**
   * Handle file change
   */
  private handleFileChange(config_id: string, eventType: string, filename: string | null): void {
    const config = this.watch_configs.get(config_id);
    if (!config || !filename) return;

    // Debounce rapid changes
    const debounce_key = `${config_id}_${filename}`;

    if (this.debounce_timers.has(debounce_key)) {
      clearTimeout(this.debounce_timers.get(debounce_key)!);
    }

    const timer = setTimeout(() => {
      this.processFileChange(config, eventType, filename);
      this.debounce_timers.delete(debounce_key);
    }, config.debounce_ms);

    this.debounce_timers.set(debounce_key, timer);
  }

  /**
   * Process file change
   */
  private async processFileChange(config: FileWatchConfig, eventType: string, filename: string): Promise<void> {
    const sync_event: SyncEvent = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      source: "file_system",
      target: config.target,
      operation: eventType === "rename" ? "update" : "update",
      path: `${config.path}/${filename}`,
      data: {
        filename,
        event_type: eventType,
      },
      synced_to_cloud: false,
    };

    this.sync_events.push(sync_event);

    this.emit("file_changed", sync_event);

    // Publish to event bus
    quantumEventBus.publish(
      "file_watcher",
      "file_changed",
      {
        target: config.target,
        path: sync_event.path,
        operation: sync_event.operation,
      },
      "medium"
    );

    // Trigger appropriate sync based on target
    await this.triggerTargetSync(config.target, sync_event);
  }

  /**
   * Trigger target-specific sync
   */
  private async triggerTargetSync(target: WatchTarget, sync_event: SyncEvent): Promise<void> {
    switch (target) {
      case "taxonomy":
        quantumEventBus.publish(
          "file_watcher",
          "taxonomy_file_changed",
          { path: sync_event.path },
          "high"
        );
        break;

      case "sop":
        quantumEventBus.publish(
          "file_watcher",
          "sop_file_changed",
          { path: sync_event.path },
          "high"
        );
        break;

      case "memory":
        quantumEventBus.publish(
          "file_watcher",
          "memory_file_changed",
          { path: sync_event.path },
          "high"
        );
        break;

      case "artifacts":
        quantumEventBus.publish(
          "file_watcher",
          "artifact_file_changed",
          { path: sync_event.path },
          "medium"
        );
        break;
    }
  }

  /**
   * Stop watcher
   */
  public stopWatcher(config_id: string): boolean {
    const watcher = this.watchers.get(config_id);
    if (!watcher) return false;

    watcher.close();
    this.watchers.delete(config_id);

    this.emit("watcher_stopped", { config_id });

    return true;
  }

  /**
   * Stop all watchers
   */
  public stopAllWatchers(): void {
    for (const [config_id, watcher] of this.watchers.entries()) {
      watcher.close();
    }

    this.watchers.clear();
    this.emit("all_watchers_stopped");
  }

  /**
   * Get sync events
   */
  public getSyncEvents(filter?: { target?: WatchTarget; since?: string }): SyncEvent[] {
    let events = [...this.sync_events];

    if (filter?.target) {
      events = events.filter((e) => e.target === filter.target);
    }

    if (filter?.since) {
      events = events.filter((e) => e.timestamp >= filter.since!);
    }

    return events;
  }
}

// ============================================================
// REAL-TIME TAXONOMY SYNC
// ============================================================

export class RealTimeTaxonomySync extends EventEmitter {
  private enterprise_taxonomy: EnterpriseTaxonomy;
  private azure_taxonomy: AzureTaxonomy;
  private last_sync: string;

  constructor(enterprise_taxonomy: EnterpriseTaxonomy, azure_taxonomy: AzureTaxonomy) {
    super();
    this.enterprise_taxonomy = enterprise_taxonomy;
    this.azure_taxonomy = azure_taxonomy;
    this.last_sync = new Date().toISOString();

    this.initializeEventSubscriptions();
    this.attachTaxonomyListeners();
  }

  /**
   * Initialize event subscriptions
   */
  private initializeEventSubscriptions(): void {
    // Subscribe to taxonomy file changes
    quantumEventBus.subscribe(
      "taxonomy_sync",
      ["taxonomy_file_changed", "model_added", "capability_changed"],
      ["file_watcher", "taxonomy_system"],
      this.handleTaxonomyEvent.bind(this)
    );
  }

  /**
   * Attach taxonomy listeners
   */
  private attachTaxonomyListeners(): void {
    // Listen to enterprise taxonomy events
    this.enterprise_taxonomy.on("model_added", (data) => {
      this.syncTaxonomyChange("model_added", data);
    });

    this.enterprise_taxonomy.on("capability_updated", (data) => {
      this.syncTaxonomyChange("capability_updated", data);
    });

    // Listen to Azure taxonomy events
    this.azure_taxonomy.on("azure:models:initialized", (data) => {
      this.syncTaxonomyChange("azure_models_initialized", data);
    });

    this.azure_taxonomy.on("azure:deployment:created", (data) => {
      this.syncTaxonomyChange("azure_deployment_created", data);
    });
  }

  /**
   * Handle taxonomy events
   */
  private async handleTaxonomyEvent(event: any): Promise<void> {
    this.emit("taxonomy_event_received", event);

    // Sync to unified brain
    quantumEventBus.publish(
      "taxonomy_system",
      "taxonomy_updated",
      {
        event_type: event.event_type,
        payload: event.payload,
      },
      "high"
    );

    // Sync to cloud
    await this.syncToCloud(event);
  }

  /**
   * Sync taxonomy change
   */
  private async syncTaxonomyChange(change_type: string, data: any): Promise<void> {
    this.last_sync = new Date().toISOString();

    // Publish to event bus
    quantumEventBus.publish(
      "taxonomy_system",
      change_type,
      data,
      "high"
    );

    // Sync to Google Cloud
    await this.syncToCloud({ event_type: change_type, payload: data });

    this.emit("taxonomy_synced", { change_type, timestamp: this.last_sync });
  }

  /**
   * Sync to cloud
   */
  private async syncToCloud(event: any): Promise<void> {
    try {
      // Export current taxonomy state
      const taxonomy_state = {
        enterprise: this.enterprise_taxonomy.exportSchema(),
        azure: this.azure_taxonomy.exportTaxonomy(),
        sync_timestamp: new Date().toISOString(),
        event: event,
      };

      // Store in Cloud Storage
      await googleCloudStorage.storeBrainSnapshot(taxonomy_state);

      this.emit("cloud_sync_completed", { event_type: event.event_type });
    } catch (error) {
      const err_msg = error instanceof Error ? error.message : String(error);
      this.emit("cloud_sync_error", { error: err_msg });
    }
  }

  /**
   * Force full sync
   */
  public async forceFullSync(): Promise<void> {
    await this.syncTaxonomyChange("full_sync", {
      enterprise_models: this.enterprise_taxonomy.getSchemaVersion(),
      azure_models: this.azure_taxonomy.getAllModels().length,
    });
  }

  /**
   * Get last sync time
   */
  public getLastSync(): string {
    return this.last_sync;
  }
}

// ============================================================
// DATA STREAM MANAGER
// ============================================================

export class DataStreamManager extends EventEmitter {
  private streams: Map<string, { id: string; source: string; active: boolean; message_count: number }> = new Map();

  constructor() {
    super();
    this.initializeStreams();
  }

  /**
   * Initialize data streams
   */
  private initializeStreams(): void {
    // Subscribe to all high-priority events
    quantumEventBus.subscribe(
      "stream_manager",
      ["*"], // All events
      [
        "ingestion_agent",
        "vision_agent",
        "strategy_agent",
        "validation_agent",
        "document_agent",
        "unified_brain",
        "taxonomy_system",
        "crawler_system",
      ],
      this.handleStreamEvent.bind(this),
      ["critical", "high"]
    );
  }

  /**
   * Handle stream event
   */
  private async handleStreamEvent(event: any): Promise<void> {
    const stream_id = event.source;

    if (!this.streams.has(stream_id)) {
      this.streams.set(stream_id, {
        id: stream_id,
        source: event.source,
        active: true,
        message_count: 0,
      });
    }

    const stream = this.streams.get(stream_id)!;
    stream.message_count++;

    this.emit("stream_event", event);

    // Real-time streaming to frontend (if connected)
    // In real implementation: use WebSocket or Server-Sent Events
  }

  /**
   * Get active streams
   */
  public getActiveStreams(): Array<{ id: string; source: string; active: boolean; message_count: number }> {
    return Array.from(this.streams.values()).filter((s) => s.active);
  }

  /**
   * Get stream stats
   */
  public getStreamStats(): Record<string, number> {
    const stats: Record<string, number> = {};

    for (const [id, stream] of this.streams.entries()) {
      stats[id] = stream.message_count;
    }

    return stats;
  }
}

// Export instances
export const fileWatcherSystem = new FileWatcherSystem();
export const dataStreamManager = new DataStreamManager();

// Helper to initialize real-time sync for taxonomy
export function initializeRealTimeTaxonomySync(
  enterprise_taxonomy: EnterpriseTaxonomy,
  azure_taxonomy: AzureTaxonomy
): RealTimeTaxonomySync {
  return new RealTimeTaxonomySync(enterprise_taxonomy, azure_taxonomy);
}
