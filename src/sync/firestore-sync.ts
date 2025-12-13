/**
 * Firestore Memory Sync Service
 *
 * Bidirectional sync between Quantum Mind (unified-brain) and Firestore
 * Handles hydration, dehydration, and real-time synchronization
 *
 * @package sync
 * @author JARVIS
 * @version 1.0.0
 */

import { EventEmitter } from "events";
import {
  firestoreMemory,
  MemoryEventType,
} from "../quantum-mind/firestore-memory";
import { unifiedBrain } from "../quantum-mind/unified-brain";
import { quantumEventBus } from "../quantum-mind/event-bus";
import type {
  SharedMemory,
  QuantumThought,
  PersistentIdea,
} from "../quantum-mind/firestore-memory";
import { log } from "../utils/logger";

/**
 * Firestore Sync Manager
 * Coordinates bidirectional sync between memory systems
 */
export class FirestoreSyncManager extends EventEmitter {
  private syncInProgress = false;
  private lastSyncTimestamp = 0;
  private syncInterval = 30000; // 30 seconds
  private batchSize = 50;

  constructor() {
    super();
    this.initializeEventListeners();
    this.startContinuousSync();
    log("[FirestoreSync] Manager initialized");
  }

  /**
   * Initialize event listeners for memory events
   */
  private initializeEventListeners(): void {
    // Listen to Firestore memory events
    firestoreMemory.on(
      MemoryEventType.MEMORY_CREATED,
      (memory: SharedMemory) => {
        this.handleMemoryCreated(memory);
      }
    );

    firestoreMemory.on(
      MemoryEventType.MEMORY_UPDATED,
      ({ id, updates }: any) => {
        this.handleMemoryUpdated(id, updates);
      }
    );

    firestoreMemory.on(
      MemoryEventType.THOUGHT_CONVERGED,
      (thought: QuantumThought) => {
        this.handleThoughtConverged(thought);
      }
    );

    firestoreMemory.on(
      MemoryEventType.IDEA_IMPLEMENTED,
      (idea: PersistentIdea) => {
        this.handleIdeaImplemented(idea);
      }
    );

    // Listen to unified brain events
    unifiedBrain.on("thought:created", (thought: any) => {
      this.syncThoughtToFirestore(thought);
    });

    unifiedBrain.on("thought:converged", (thought: any) => {
      this.syncConvergedThought(thought);
    });

    unifiedBrain.on("idea:proposed", (idea: any) => {
      this.syncIdeaToFirestore(idea);
    });

    unifiedBrain.on("memory:created", (memory: any) => {
      this.syncMemoryToFirestore(memory);
    });

    // Listen to quantum event bus
    quantumEventBus.subscribe(
      "firestore-sync",
      ["consensus_finalized", "memory_hydrated", "memory_dehydrated"],
      [],
      (event) => {
        this.handleEventBusEvent(event);
      }
    );

    log("[FirestoreSync] Event listeners initialized");
  }

  /**
   * Start continuous background sync
   */
  private startContinuousSync(): void {
    setInterval(() => {
      this.performBackgroundSync();
    }, this.syncInterval);

    log(
      `[FirestoreSync] Background sync started (interval: ${this.syncInterval}ms)`
    );
  }

  /**
   * Perform background sync of all memories
   */
  private async performBackgroundSync(): Promise<void> {
    if (this.syncInProgress) {
      return;
    }

    try {
      this.syncInProgress = true;
      const now = Date.now();

      // Only sync if enough time has passed since last sync
      if (now - this.lastSyncTimestamp < this.syncInterval) {
        return;
      }

      this.lastSyncTimestamp = now;

      // Sync dehydrated memories back to active state
      await this.rehydrateDehydratedMemories();

      // Prune old memories
      await this.pruneOldMemories();

      // Analyze memory health
      await this.analyzeMemoryHealth();

      this.emit("sync:complete", { timestamp: now });
    } catch (error: any) {
      log(`[FirestoreSync] Background sync error: ${error.message}`, "error");
      this.emit("sync:error", { error: error.message });
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync thought to Firestore
   */
  private async syncThoughtToFirestore(thought: any): Promise<void> {
    try {
      await firestoreMemory.createThought({
        topic: thought.topic,
        description: thought.description,
        thinking_mode: thought.thinking_mode,
        status: "proposed",
        debate_rounds: [],
        participating_agents: thought.agents || [],
        metadata: thought.metadata,
      });

      log(`[FirestoreSync] Thought synced: ${thought.id}`);
      this.emit("thought:synced", thought);
    } catch (error: any) {
      log(`[FirestoreSync] Failed to sync thought: ${error.message}`, "error");
    }
  }

  /**
   * Sync converged thought to Firestore
   */
  private async syncConvergedThought(thought: any): Promise<void> {
    try {
      await firestoreMemory.updateThought(thought.id, {
        status: "consensus",
        ...thought,
      });

      // Create persistent idea from converged thought
      if (thought.should_implement) {
        await firestoreMemory.createIdea({
          thought_id: thought.id,
          category: thought.category || "system_idea",
          title: thought.title,
          description: thought.description,
          rationale: thought.rationale,
          implementation_steps: thought.implementation_steps || [],
          expected_outcomes: thought.expected_outcomes || [],
          risk_assessment: thought.risk_assessment,
          status: "proposed",
          automated_docs: {
            readme_generated: false,
            api_docs_generated: false,
            deployment_guide_generated: false,
            test_plan_generated: false,
          },
          synced_to_google_drive: false,
        });

        log(
          `[FirestoreSync] Converged thought converted to idea: ${thought.id}`
        );
      }

      this.emit("thought:converged:synced", thought);
    } catch (error: any) {
      log(
        `[FirestoreSync] Failed to sync converged thought: ${error.message}`,
        "error"
      );
    }
  }

  /**
   * Sync idea to Firestore
   */
  private async syncIdeaToFirestore(idea: any): Promise<void> {
    try {
      await firestoreMemory.createIdea({
        thought_id: idea.thought_id,
        category: idea.category,
        title: idea.title,
        description: idea.description,
        rationale: idea.rationale,
        implementation_steps: idea.implementation_steps,
        expected_outcomes: idea.expected_outcomes,
        risk_assessment: idea.risk_assessment,
        status: "proposed",
        automated_docs: idea.automated_docs,
        synced_to_google_drive: false,
      });

      log(`[FirestoreSync] Idea synced: ${idea.id}`);
      this.emit("idea:synced", idea);
    } catch (error: any) {
      log(`[FirestoreSync] Failed to sync idea: ${error.message}`, "error");
    }
  }

  /**
   * Sync memory to Firestore
   */
  private async syncMemoryToFirestore(memory: any): Promise<void> {
    try {
      await firestoreMemory.createMemory({
        memory_type: memory.memory_type,
        content: memory.content,
        source_agents: memory.source_agents || [],
        relevance_score: memory.relevance_score || 0.5,
        tags: memory.tags || [],
        related_thoughts: memory.related_thoughts || [],
      });

      log(`[FirestoreSync] Memory synced: ${memory.id}`);
      this.emit("memory:synced", memory);
    } catch (error: any) {
      log(`[FirestoreSync] Failed to sync memory: ${error.message}`, "error");
    }
  }

  /**
   * Rehydrate dehydrated memories
   */
  private async rehydrateDehydratedMemories(): Promise<void> {
    try {
      const dehydrated = await firestoreMemory.searchMemories({
        hydration_state: "dehydrated",
        limit: this.batchSize,
      });

      for (const memory of dehydrated) {
        await firestoreMemory.hydrateMemory(memory.id);
      }

      if (dehydrated.length > 0) {
        log(`[FirestoreSync] Rehydrated ${dehydrated.length} memories`);
        this.emit("memories:rehydrated", { count: dehydrated.length });
      }
    } catch (error: any) {
      log(`[FirestoreSync] Rehydration error: ${error.message}`, "error");
    }
  }

  /**
   * Prune old memories based on criteria
   */
  private async pruneOldMemories(): Promise<void> {
    try {
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() - 30); // 30 days ago

      const pruned = await firestoreMemory.pruneMemories({
        olderThan: thresholdDate,
        minAccessCount: 0,
        archiveInsteadOfDelete: true,
      });

      if (pruned > 0) {
        log(`[FirestoreSync] Pruned ${pruned} old memories`);
        this.emit("memories:pruned", { count: pruned });
      }
    } catch (error: any) {
      log(`[FirestoreSync] Pruning error: ${error.message}`, "error");
    }
  }

  /**
   * Analyze memory health and emit metrics
   */
  private async analyzeMemoryHealth(): Promise<void> {
    try {
      const health = await firestoreMemory.getSystemHealth();
      this.emit("memory:health", health);
      log(`[FirestoreSync] Memory health analyzed: ${JSON.stringify(health)}`);
    } catch (error: any) {
      log(`[FirestoreSync] Health analysis error: ${error.message}`, "error");
    }
  }

  /**
   * Handle memory created event
   */
  private async handleMemoryCreated(memory: SharedMemory): Promise<void> {
    // Notify unified brain of new memory
    unifiedBrain.emit("memory:created:firestore", memory);
    this.emit("memory:created", memory);
  }

  /**
   * Handle memory updated event
   */
  private async handleMemoryUpdated(id: string, updates: any): Promise<void> {
    unifiedBrain.emit("memory:updated:firestore", { id, updates });
    this.emit("memory:updated", { id, updates });
  }

  /**
   * Handle thought converged event
   */
  private async handleThoughtConverged(thought: QuantumThought): Promise<void> {
    unifiedBrain.emit("thought:converged:firestore", thought);
    this.emit("thought:converged", thought);
  }

  /**
   * Handle idea implemented event
   */
  private async handleIdeaImplemented(idea: PersistentIdea): Promise<void> {
    unifiedBrain.emit("idea:implemented:firestore", idea);
    this.emit("idea:implemented", idea);
  }

  /**
   * Handle quantum event bus events
   */
  private async handleEventBusEvent(event: any): Promise<void> {
    const { event_type, payload } = event;

    switch (event_type) {
      case "consensus_finalized":
        // Persist consensus result
        await this.syncMemoryToFirestore({
          memory_type: "decision",
          content: JSON.stringify(payload),
          source_agents: payload.supporting_agents,
          relevance_score: 0.95,
          tags: ["consensus", "decision"],
        });
        break;

      case "memory_hydrated":
        this.emit("memory:hydrated", payload);
        break;

      case "memory_dehydrated":
        this.emit("memory:dehydrated", payload);
        break;
    }
  }

  /**
   * Force immediate sync of specific memory
   */
  async forceSyncMemory(memoryId: string): Promise<void> {
    try {
      const memory = await firestoreMemory.getMemory(memoryId);
      if (memory) {
        unifiedBrain.emit("memory:synced:forced", memory);
        log(`[FirestoreSync] Forced sync for memory: ${memoryId}`);
      }
    } catch (error: any) {
      log(`[FirestoreSync] Failed to force sync: ${error.message}`, "error");
    }
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<any> {
    return {
      lastSyncTimestamp: this.lastSyncTimestamp,
      syncInterval: this.syncInterval,
      syncInProgress: this.syncInProgress,
      health: await firestoreMemory.getSystemHealth(),
    };
  }

  /**
   * Set sync interval (milliseconds)
   */
  setSyncInterval(interval: number): void {
    this.syncInterval = Math.max(5000, interval); // Minimum 5 seconds
    log(`[FirestoreSync] Sync interval updated to ${this.syncInterval}ms`);
  }
}

// Singleton instance
export const firestoreSyncManager = new FirestoreSyncManager();

// Export for direct usage
export async function initializeFirestoreSync(): Promise<void> {
  log("[FirestoreSync] Initialization complete - bidirectional sync active");
}

export default firestoreSyncManager;
