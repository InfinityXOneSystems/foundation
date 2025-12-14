// src/services/secrets-sync-daemon.ts
// Daemon service for continuous 24/7 secrets synchronization

import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export interface DaemonConfig {
  intervalHours: number;
  enabled: boolean;
  autoStart: boolean;
}

export interface SyncStatus {
  lastSync: string;
  nextSync: string;
  successCount: number;
  failureCount: number;
  repositories: Record<string, RepoSyncStatus>;
}

export interface RepoSyncStatus {
  lastSync: string;
  status: "success" | "failed" | "pending";
  message: string;
}

export type SyncFunction = () => Promise<{ success: boolean; message: string }>;

const STATE_DIR = path.join(os.homedir(), ".infinity-x-one");
const STATE_FILE = path.join(STATE_DIR, "secrets-sync-state.json");
const LOCK_FILE = path.join(STATE_DIR, "secrets-sync.lock");

export class SecretsSyncDaemon {
  private config: DaemonConfig;
  private syncFunction: SyncFunction;
  private isRunning: boolean = false;
  private intervalHandle: NodeJS.Timeout | null = null;
  private shutdownRequested: boolean = false;

  constructor(config: DaemonConfig, syncFunction: SyncFunction) {
    this.config = config;
    this.syncFunction = syncFunction;
  }

  /**
   * Start the daemon
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log("⚠️  Daemon is already running");
      return;
    }

    // Check for existing lock
    if (this.isLocked()) {
      console.error("❌ Another instance is already running (lock file exists)");
      console.error(`   Lock file: ${LOCK_FILE}`);
      throw new Error("Another instance is already running");
    }

    // Create lock file
    this.createLock();

    // Setup signal handlers
    this.setupSignalHandlers();

    console.log("🚀 Starting Secrets Sync Daemon");
    console.log(`   Interval: ${this.config.intervalHours} hours`);
    console.log(`   Press Ctrl+C to stop gracefully\n`);

    this.isRunning = true;

    // Initial sync
    await this.performSync();

    // Schedule periodic syncs
    if (this.config.enabled) {
      this.scheduleNextSync();
    } else {
      console.log("⏸️  Daemon started but sync is disabled in config");
    }
  }

  /**
   * Stop the daemon gracefully
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log("\n🛑 Stopping daemon gracefully...");
    this.shutdownRequested = true;

    // Clear interval
    if (this.intervalHandle) {
      clearTimeout(this.intervalHandle);
      this.intervalHandle = null;
    }

    // Remove lock file
    this.removeLock();

    this.isRunning = false;
    console.log("✅ Daemon stopped");
  }

  /**
   * Perform a sync operation
   */
  private async performSync(): Promise<void> {
    if (this.shutdownRequested) {
      return;
    }

    const timestamp = new Date().toISOString();
    console.log(`\n⏰ [${timestamp}] Starting sync...`);

    try {
      const result = await this.syncFunction();
      
      // Update status
      const status = this.loadStatus();
      status.lastSync = timestamp;
      status.nextSync = this.calculateNextSync();
      
      if (result.success) {
        status.successCount++;
        console.log(`✅ Sync completed successfully: ${result.message}`);
      } else {
        status.failureCount++;
        console.error(`❌ Sync failed: ${result.message}`);
      }

      this.saveStatus(status);
    } catch (error) {
      console.error("❌ Sync error:", error);
      
      const status = this.loadStatus();
      status.failureCount++;
      status.lastSync = timestamp;
      status.nextSync = this.calculateNextSync();
      this.saveStatus(status);
    }

    console.log(`\n⏳ Next sync in ${this.config.intervalHours} hours`);
  }

  /**
   * Schedule the next sync
   */
  private scheduleNextSync(): void {
    if (this.shutdownRequested) {
      return;
    }

    const intervalMs = this.config.intervalHours * 60 * 60 * 1000;
    
    this.intervalHandle = setTimeout(async () => {
      await this.performSync();
      this.scheduleNextSync();
    }, intervalMs);
  }

  /**
   * Calculate next sync time
   */
  private calculateNextSync(): string {
    const next = new Date();
    next.setHours(next.getHours() + this.config.intervalHours);
    return next.toISOString();
  }

  /**
   * Setup signal handlers for graceful shutdown
   */
  private setupSignalHandlers(): void {
    const handler = async () => {
      if (!this.shutdownRequested) {
        await this.stop();
        process.exit(0);
      }
    };

    process.on("SIGINT", handler);
    process.on("SIGTERM", handler);
  }

  /**
   * Check if another instance is running
   */
  private isLocked(): boolean {
    if (!fs.existsSync(LOCK_FILE)) {
      return false;
    }

    try {
      const lockData = JSON.parse(fs.readFileSync(LOCK_FILE, "utf-8"));
      const pid = lockData.pid;

      // Check if process is still running
      try {
        process.kill(pid, 0);
        return true; // Process exists
      } catch {
        // Process doesn't exist, stale lock
        console.log("⚠️  Removing stale lock file");
        this.removeLock();
        return false;
      }
    } catch {
      // Invalid lock file
      this.removeLock();
      return false;
    }
  }

  /**
   * Create lock file
   */
  private createLock(): void {
    try {
      if (!fs.existsSync(STATE_DIR)) {
        fs.mkdirSync(STATE_DIR, { recursive: true });
      }

      const lockData = {
        pid: process.pid,
        startedAt: new Date().toISOString(),
      };

      fs.writeFileSync(LOCK_FILE, JSON.stringify(lockData, null, 2));
    } catch (error) {
      console.error("Failed to create lock file:", error);
    }
  }

  /**
   * Remove lock file
   */
  private removeLock(): void {
    try {
      if (fs.existsSync(LOCK_FILE)) {
        fs.unlinkSync(LOCK_FILE);
      }
    } catch (error) {
      console.debug("Failed to remove lock file:", error);
    }
  }

  /**
   * Load sync status
   */
  private loadStatus(): SyncStatus {
    try {
      if (fs.existsSync(STATE_FILE)) {
        return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
      }
    } catch (error) {
      console.debug("Failed to load status:", error);
    }

    // Return default status
    return {
      lastSync: "",
      nextSync: "",
      successCount: 0,
      failureCount: 0,
      repositories: {},
    };
  }

  /**
   * Save sync status
   */
  private saveStatus(status: SyncStatus): void {
    try {
      if (!fs.existsSync(STATE_DIR)) {
        fs.mkdirSync(STATE_DIR, { recursive: true });
      }

      fs.writeFileSync(STATE_FILE, JSON.stringify(status, null, 2));
    } catch (error) {
      console.debug("Failed to save status:", error);
    }
  }

  /**
   * Get current status
   */
  static getStatus(): SyncStatus | null {
    try {
      if (fs.existsSync(STATE_FILE)) {
        return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
      }
    } catch (error) {
      console.debug("Failed to get status:", error);
    }
    return null;
  }

  /**
   * Check if daemon is running
   */
  static isRunning(): boolean {
    if (!fs.existsSync(LOCK_FILE)) {
      return false;
    }

    try {
      const lockData = JSON.parse(fs.readFileSync(LOCK_FILE, "utf-8"));
      const pid = lockData.pid;

      // Check if process is still running
      try {
        process.kill(pid, 0);
        return true;
      } catch {
        return false;
      }
    } catch {
      return false;
    }
  }
}
