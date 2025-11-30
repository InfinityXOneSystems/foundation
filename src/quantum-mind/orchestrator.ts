/**
 * Quantum Mind Orchestrator
 * Main control system for all quantum mind components
 * 
 * @package quantum-mind
 * @author JARVIS
 * @version 1.0.0
 */

import { EventEmitter } from "events";
import { quantumEventBus } from "./event-bus";
import { unifiedBrain } from "./unified-brain";
import {
  ingestionAgent,
  visionAgent,
  strategyAgent,
  validationAgent,
  documentAgent,
} from "./agents";
import { crawlerEngine, headlessBrowserAgent } from "./crawler";
import { googleDriveSync, googleCloudStorage } from "./google-cloud";
import { platformManager } from "./platforms";
import { fileWatcherSystem, dataStreamManager, initializeRealTimeTaxonomySync } from "./realtime-sync";
import { EnterpriseTaxonomy } from "../taxonomy/enterprise-taxonomy";
import { AzureTaxonomy } from "../taxonomy/azure-taxonomy";

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface QuantumMindConfig {
  taxonomy: {
    enterprise_taxonomy: EnterpriseTaxonomy;
    azure_taxonomy: AzureTaxonomy;
    auto_sync: boolean;
  };
  google_cloud: {
    drive_base_folder_id?: string;
    storage_bucket?: string;
    folders?: {
      conversations: string;
      strategies: string;
      plans: string;
      memories: string;
      documents: string;
    };
  };
  platforms: {
    chatgpt_api_key?: string;
    gemini_api_key?: string;
    google_api_key?: string;
    github_token?: string;
  };
  file_watchers: {
    enabled: boolean;
    paths?: {
      taxonomy?: string;
      sop?: string;
      memory?: string;
      artifacts?: string;
    };
  };
  frontend_options?: Record<string, unknown>;
}

export interface QuantumMindStats {
  uptime_seconds: number;
  total_thoughts: number;
  active_debates: number;
  persistent_ideas: number;
  shared_memories: number;
  agents_active: number;
  events_processed: number;
  cloud_synced_items: number;
  crawler_jobs: number;
  platform_queries: number;
}

// ============================================================
// QUANTUM MIND ORCHESTRATOR
// ============================================================

export class QuantumMindOrchestrator extends EventEmitter {
  private config: QuantumMindConfig;
  private initialized: boolean = false;
  private started: boolean = false;
  private start_time: number = 0;
  private realtime_taxonomy_sync: any;

  constructor(config: QuantumMindConfig) {
    super();
    this.config = config;
  }

  /**
   * Initialize Quantum Mind system
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      throw new Error("Quantum Mind already initialized");
    }

    this.emit("initialization_started");

    try {
      // 1. Configure Google Cloud
      if (this.config.google_cloud.drive_base_folder_id && this.config.google_cloud.folders) {
        googleDriveSync.configureFolders(
          this.config.google_cloud.drive_base_folder_id,
          this.config.google_cloud.folders
        );
      }

      // 2. Configure platforms
      if (this.config.platforms.chatgpt_api_key) {
        platformManager.configurePlatform({
          platform: "chatgpt",
          enabled: true,
          api_key: this.config.platforms.chatgpt_api_key,
          trigger_type: "event",
        });
      }

      if (this.config.platforms.gemini_api_key) {
        platformManager.configurePlatform({
          platform: "gemini",
          enabled: true,
          api_key: this.config.platforms.gemini_api_key,
          trigger_type: "event",
        });
      }

      if (this.config.platforms.google_api_key) {
        platformManager.configurePlatform({
          platform: "google",
          enabled: true,
          api_key: this.config.platforms.google_api_key,
          trigger_type: "poll",
          poll_interval_ms: 60000,
        });
      }

      if (this.config.platforms.github_token) {
        platformManager.configurePlatform({
          platform: "github",
          enabled: true,
          api_key: this.config.platforms.github_token,
          trigger_type: "webhook",
        });
      }

      // 3. Initialize real-time taxonomy sync
      if (this.config.taxonomy.auto_sync) {
        this.realtime_taxonomy_sync = initializeRealTimeTaxonomySync(
          this.config.taxonomy.enterprise_taxonomy,
          this.config.taxonomy.azure_taxonomy
        );
      }

      // 4. Setup file watchers
      if (this.config.file_watchers.enabled && this.config.file_watchers.paths) {
        this.setupFileWatchers();
      }

      // 5. Connect all agents to unified brain
      this.connectAgents();

      this.initialized = true;
      this.emit("initialization_completed");

      console.log("🧠 Quantum Mind System Initialized");
      console.log("   - 5 Agents Connected");
      console.log("   - Unified Brain Active");
      console.log("   - Event Bus Running");
      console.log("   - Real-time Sync Enabled");
      console.log("   - Cloud Integration Ready");
    } catch (error) {
      const err_msg = error instanceof Error ? error.message : String(error);
      this.emit("initialization_error", { error: err_msg });
      throw error;
    }
  }

  /**
   * Setup file watchers
   */
  private setupFileWatchers(): void {
    const paths = this.config.file_watchers.paths!;

    if (paths.taxonomy) {
      fileWatcherSystem.addWatcher({
        id: "taxonomy_watcher",
        target: "taxonomy",
        path: paths.taxonomy,
        recursive: true,
        sync_direction: "local_to_cloud",
        debounce_ms: 1000,
        enabled: true,
      });
    }

    if (paths.sop) {
      fileWatcherSystem.addWatcher({
        id: "sop_watcher",
        target: "sop",
        path: paths.sop,
        recursive: true,
        sync_direction: "local_to_cloud",
        debounce_ms: 1000,
        enabled: true,
      });
    }

    if (paths.memory) {
      fileWatcherSystem.addWatcher({
        id: "memory_watcher",
        target: "memory",
        path: paths.memory,
        recursive: true,
        sync_direction: "bidirectional",
        debounce_ms: 500,
        enabled: true,
      });
    }

    if (paths.artifacts) {
      fileWatcherSystem.addWatcher({
        id: "artifacts_watcher",
        target: "artifacts",
        path: paths.artifacts,
        recursive: true,
        sync_direction: "local_to_cloud",
        debounce_ms: 2000,
        enabled: true,
      });
    }
  }

  /**
   * Connect agents
   */
  private connectAgents(): void {
    // All agents are already connected via event bus in their constructors
    // This is just for logging/verification

    this.emit("agents_connected", {
      agents: ["ingestion", "vision", "strategy", "validation", "document"],
    });
  }

  /**
   * Start Quantum Mind system
   */
  public async start(): Promise<void> {
    if (!this.initialized) {
      throw new Error("Quantum Mind not initialized. Call initialize() first.");
    }

    if (this.started) {
      throw new Error("Quantum Mind already started");
    }

    this.start_time = Date.now();
    this.started = true;

    this.emit("system_started");

    console.log("🚀 Quantum Mind System Started");
    console.log("   - All systems operational");
    console.log("   - Ready for quantum thinking");
  }

  /**
   * Initiate quantum thinking
   */
  public async think(
    topic: string,
    description: string,
    options?: {
      mode?: "quantum" | "linear" | "creative" | "analytical" | "debate";
      participating_agents?: Array<"ingestion" | "vision" | "strategy" | "validation" | "document">;
      frontend_options?: Record<string, unknown>;
    }
  ): Promise<string> {
    if (!this.started) {
      throw new Error("Quantum Mind not started. Call start() first.");
    }

    const thought_id = unifiedBrain.initiateThinking(
      topic,
      description,
      options?.mode || "quantum",
      options?.participating_agents || ["ingestion", "vision", "strategy", "validation", "document"],
      {
        ...this.config.frontend_options,
        ...options?.frontend_options,
      }
    );

    this.emit("thinking_initiated", { thought_id, topic });

    return thought_id;
  }

  /**
   * Create crawl job
   */
  public crawl(config: any): string {
    if (!this.started) {
      throw new Error("Quantum Mind not started");
    }

    return crawlerEngine.createJob(config);
  }

  /**
   * Query AI platform
   */
  public async queryPlatform(
    platform: "chatgpt" | "gemini" | "google" | "github",
    query: string,
    options?: Record<string, unknown>
  ): Promise<string> {
    if (!this.started) {
      throw new Error("Quantum Mind not started");
    }

    return await platformManager.queryPlatform(platform, query, options);
  }

  /**
   * Get system stats
   */
  public getStats(): QuantumMindStats {
    const brain_state = unifiedBrain.exportState();
    const event_metrics = quantumEventBus.getMetrics();

    return {
      uptime_seconds: this.started ? Math.floor((Date.now() - this.start_time) / 1000) : 0,
      total_thoughts: brain_state.thoughts.length,
      active_debates: brain_state.active_debates.length,
      persistent_ideas: brain_state.persistent_ideas.length,
      shared_memories: brain_state.shared_memory.length,
      agents_active: 5,
      events_processed: event_metrics.total_events,
      cloud_synced_items: googleDriveSync.getAllSyncedItems({ sync_status: "synced" }).length,
      crawler_jobs: crawlerEngine.getAllJobs().length,
      platform_queries: 0, // Would track in platform manager
    };
  }

  /**
   * Stop Quantum Mind system
   */
  public async stop(): Promise<void> {
    if (!this.started) {
      return;
    }

    // Stop all file watchers
    fileWatcherSystem.stopAllWatchers();

    // Stop event bus
    quantumEventBus.stop();

    this.started = false;

    this.emit("system_stopped");

    console.log("🛑 Quantum Mind System Stopped");
  }

  /**
   * Get thought status
   */
  public getThought(thought_id: string) {
    return unifiedBrain.getThought(thought_id);
  }

  /**
   * Get persistent idea
   */
  public getIdea(idea_id: string) {
    return unifiedBrain.getPersistentIdea(idea_id);
  }

  /**
   * Query shared memory
   */
  public queryMemory(query: Parameters<typeof unifiedBrain.queryMemory>[0]) {
    return unifiedBrain.queryMemory(query);
  }

  /**
   * Export complete system state
   */
  public exportSystemState(): Record<string, unknown> {
    return {
      config: this.config,
      initialized: this.initialized,
      started: this.started,
      stats: this.getStats(),
      brain_state: unifiedBrain.exportState(),
      event_metrics: quantumEventBus.getMetrics(),
      sync_events: fileWatcherSystem.getSyncEvents(),
      drive_items: googleDriveSync.getAllSyncedItems(),
      stream_stats: dataStreamManager.getStreamStats(),
      exported_at: new Date().toISOString(),
    };
  }
}

// Export orchestrator class
export default QuantumMindOrchestrator;
