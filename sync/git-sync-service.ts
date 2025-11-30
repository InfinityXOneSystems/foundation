/**
 * Git Bidirectional Sync Service
 * 
 * Enterprise-grade TypeScript implementation for automated Git synchronization
 * with comprehensive error handling, conflict resolution, and monitoring.
 */

import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

export interface SyncConfig {
  repositoryPath: string;
  remote: string;
  branch?: string;
  strategy: 'merge' | 'rebase' | 'fast-forward-only';
  autoCommit: boolean;
  forcePush: boolean;
  interval?: number;
  dryRun?: boolean;
  onConflict?: 'abort' | 'stash' | 'auto-resolve';
  maxRetries?: number;
  retryDelay?: number;
}

export interface SyncResult {
  success: boolean;
  timestamp: Date;
  branch: string;
  commitsAhead: number;
  commitsBehind: number;
  changesPulled: boolean;
  changesPushed: boolean;
  conflicts: string[];
  error?: string;
  duration: number;
}

export interface SyncMetrics {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  conflictsResolved: number;
  averageDuration: number;
  lastSyncTime?: Date;
  lastError?: string;
}

export class GitSyncService extends EventEmitter {
  private config: Required<SyncConfig>;
  private syncTimer: NodeJS.Timeout | undefined;
  private isRunning: boolean = false;
  private metrics: SyncMetrics;

  constructor(config: SyncConfig) {
    super();
    
    this.config = {
      ...config,
      branch: config.branch || '',
      interval: config.interval || 0,
      dryRun: config.dryRun || false,
      onConflict: config.onConflict || 'stash',
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 5000,
    };

    this.metrics = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      conflictsResolved: 0,
      averageDuration: 0,
    };
  }

  /**
   * Start continuous synchronization
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Sync service is already running');
    }

    this.isRunning = true;
    this.emit('started');

    if (this.config.interval && this.config.interval > 0) {
      // Continuous mode
      await this.syncWithRetry();
      this.syncTimer = setInterval(() => {
        this.syncWithRetry();
      }, this.config.interval);
    } else {
      // One-time sync
      await this.syncWithRetry();
      this.isRunning = false;
    }
  }

  /**
   * Stop continuous synchronization
   */
  public stop(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = undefined;
    }
    this.isRunning = false;
    this.emit('stopped');
  }

  /**
   * Get current metrics
   */
  public getMetrics(): SyncMetrics {
    return { ...this.metrics };
  }

  /**
   * Execute sync with retry logic
   */
  private async syncWithRetry(): Promise<SyncResult> {
    let lastError: string | undefined;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const result = await this.sync();
        
        if (result.success) {
          return result;
        }

        lastError = result.error;
        
        if (attempt < this.config.maxRetries) {
          this.emit('retrying', { attempt, maxRetries: this.config.maxRetries, error: lastError });
          await this.sleep(this.config.retryDelay);
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        
        if (attempt < this.config.maxRetries) {
          this.emit('retrying', { attempt, maxRetries: this.config.maxRetries, error: lastError });
          await this.sleep(this.config.retryDelay);
        }
      }
    }

    const failedResult: SyncResult = {
      success: false,
      timestamp: new Date(),
      branch: '',
      commitsAhead: 0,
      commitsBehind: 0,
      changesPulled: false,
      changesPushed: false,
      conflicts: [],
      error: `All ${this.config.maxRetries} retry attempts failed. Last error: ${lastError}`,
      duration: 0,
    };

    this.emit('failed', failedResult);
    return failedResult;
  }

  /**
   * Perform bidirectional synchronization
   */
  private async sync(): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      success: false,
      timestamp: new Date(),
      branch: '',
      commitsAhead: 0,
      commitsBehind: 0,
      changesPulled: false,
      changesPushed: false,
      conflicts: [],
      duration: 0,
    };

    try {
      this.emit('sync-started');
      this.metrics.totalSyncs++;

      // Verify Git repository
      await this.execGit('rev-parse --git-dir');

      // Get current branch
      const branch = this.config.branch || (await this.getCurrentBranch());
      result.branch = branch;

      // Get remote tracking branch
      const remoteBranch = await this.getRemoteBranch(branch);

      // Handle uncommitted changes
      const hasChanges = await this.hasUncommittedChanges();
      let stashed = false;

      if (hasChanges) {
        if (this.config.autoCommit) {
          await this.autoCommit();
        } else if (this.config.onConflict === 'stash') {
          await this.stashChanges();
          stashed = true;
        } else if (this.config.onConflict === 'abort') {
          throw new Error('Uncommitted changes detected. Aborting sync.');
        }
      }

      // Fetch from remote
      await this.fetch();

      // Get commit counts
      const { ahead, behind } = await this.getCommitCounts(branch, remoteBranch);
      result.commitsAhead = ahead;
      result.commitsBehind = behind;

      // Pull if behind
      if (behind > 0) {
        const pullSuccess = await this.pull(branch);
        result.changesPulled = pullSuccess;

        if (!pullSuccess) {
          const conflicts = await this.getConflictedFiles();
          result.conflicts = conflicts;
          
          if (conflicts.length > 0) {
            this.metrics.conflictsResolved++;
            this.emit('conflicts', { branch, conflicts });
          }
        }
      }

      // Push if ahead
      if (ahead > 0) {
        const pushSuccess = await this.push(branch);
        result.changesPushed = pushSuccess;
      }

      // Restore stashed changes
      if (stashed) {
        await this.popStash();
      }

      result.success = true;
      result.duration = Date.now() - startTime;

      this.metrics.successfulSyncs++;
      this.metrics.lastSyncTime = result.timestamp;
      this.updateAverageDuration(result.duration);

      this.emit('sync-completed', result);

      return result;

    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      result.duration = Date.now() - startTime;
      
      this.metrics.failedSyncs++;
      this.metrics.lastError = result.error;

      this.emit('sync-failed', result);

      return result;
    }
  }

  /**
   * Execute Git command
   */
  private async execGit(command: string): Promise<string> {
    const { stdout, stderr } = await execAsync(`git ${command}`, {
      cwd: this.config.repositoryPath,
    });

    if (stderr && !stderr.includes('Already up to date')) {
      // Some Git commands output to stderr even on success
      // Only throw if it's an actual error
      if (stderr.toLowerCase().includes('error') || stderr.toLowerCase().includes('fatal')) {
        throw new Error(stderr);
      }
    }

    return stdout.trim();
  }

  /**
   * Get current branch
   */
  private async getCurrentBranch(): Promise<string> {
    return await this.execGit('rev-parse --abbrev-ref HEAD');
  }

  /**
   * Get remote tracking branch
   */
  private async getRemoteBranch(localBranch: string): Promise<string> {
    try {
      return await this.execGit(`rev-parse --abbrev-ref ${localBranch}@{upstream}`);
    } catch {
      return `${this.config.remote}/${localBranch}`;
    }
  }

  /**
   * Check for uncommitted changes
   */
  private async hasUncommittedChanges(): Promise<boolean> {
    try {
      await this.execGit('diff-index --quiet HEAD --');
      return false;
    } catch {
      return true;
    }
  }

  /**
   * Get commit counts (ahead/behind)
   */
  private async getCommitCounts(localBranch: string, remoteBranch: string): Promise<{ ahead: number; behind: number }> {
    try {
      const ahead = parseInt(await this.execGit(`rev-list --count ${remoteBranch}..${localBranch}`), 10);
      const behind = parseInt(await this.execGit(`rev-list --count ${localBranch}..${remoteBranch}`), 10);
      return { ahead: ahead || 0, behind: behind || 0 };
    } catch {
      return { ahead: 0, behind: 0 };
    }
  }

  /**
   * Stash uncommitted changes
   */
  private async stashChanges(): Promise<void> {
    await this.execGit('stash push -u -m "Auto-stash before sync"');
    this.emit('stashed');
  }

  /**
   * Pop stashed changes
   */
  private async popStash(): Promise<void> {
    try {
      await this.execGit('stash pop');
      this.emit('stash-popped');
    } catch (error) {
      this.emit('stash-pop-failed', error);
    }
  }

  /**
   * Auto-commit uncommitted changes
   */
  private async autoCommit(): Promise<void> {
    await this.execGit('add -A');
    const timestamp = new Date().toISOString();
    await this.execGit(`commit -m "Auto-commit: ${timestamp} [bidirectional-sync]"`);
    this.emit('auto-committed');
  }

  /**
   * Fetch from remote
   */
  private async fetch(): Promise<void> {
    if (this.config.dryRun) {
      this.emit('dry-run', { operation: 'fetch' });
      return;
    }
    
    await this.execGit(`fetch ${this.config.remote} --prune --tags`);
    this.emit('fetched');
  }

  /**
   * Pull changes
   */
  private async pull(branch: string): Promise<boolean> {
    if (this.config.dryRun) {
      this.emit('dry-run', { operation: 'pull', branch });
      return true;
    }

    try {
      switch (this.config.strategy) {
        case 'merge':
          await this.execGit(`pull ${this.config.remote} ${branch} --no-rebase`);
          break;
        case 'rebase':
          await this.execGit(`pull ${this.config.remote} ${branch} --rebase`);
          break;
        case 'fast-forward-only':
          await this.execGit(`pull ${this.config.remote} ${branch} --ff-only`);
          break;
      }
      this.emit('pulled', { branch, strategy: this.config.strategy });
      return true;
    } catch (error) {
      this.emit('pull-failed', { branch, error });
      return false;
    }
  }

  /**
   * Push changes
   */
  private async push(branch: string): Promise<boolean> {
    if (this.config.dryRun) {
      this.emit('dry-run', { operation: 'push', branch });
      return true;
    }

    try {
      if (this.config.forcePush) {
        await this.execGit(`push ${this.config.remote} ${branch} --force-with-lease`);
      } else {
        await this.execGit(`push ${this.config.remote} ${branch}`);
      }
      this.emit('pushed', { branch });
      return true;
    } catch (error) {
      this.emit('push-failed', { branch, error });
      return false;
    }
  }

  /**
   * Get conflicted files
   */
  private async getConflictedFiles(): Promise<string[]> {
    try {
      const output = await this.execGit('diff --name-only --diff-filter=U');
      return output ? output.split('\n').filter(f => f.trim()) : [];
    } catch {
      return [];
    }
  }

  /**
   * Update average duration metric
   */
  private updateAverageDuration(duration: number): void {
    const total = this.metrics.averageDuration * (this.metrics.totalSyncs - 1) + duration;
    this.metrics.averageDuration = total / this.metrics.totalSyncs;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Example usage
 */
export async function example() {
  const syncService = new GitSyncService({
    repositoryPath: process.cwd(),
    remote: 'origin',
    strategy: 'merge',
    autoCommit: false,
    forcePush: false,
    interval: 300000, // 5 minutes
    onConflict: 'stash',
    maxRetries: 3,
    retryDelay: 5000,
  });

  // Event listeners
  syncService.on('sync-started', () => {
    console.log('🔄 Sync started...');
  });

  syncService.on('sync-completed', (result: SyncResult) => {
    console.log('✅ Sync completed:', result);
  });

  syncService.on('sync-failed', (result: SyncResult) => {
    console.error('❌ Sync failed:', result.error);
  });

  syncService.on('conflicts', ({ branch, conflicts }) => {
    console.warn('⚠️  Conflicts detected:', { branch, conflicts });
  });

  syncService.on('retrying', ({ attempt, maxRetries, error }) => {
    console.log(`🔁 Retrying (${attempt}/${maxRetries}): ${error}`);
  });

  // Start sync service
  await syncService.start();

  // Get metrics after some time
  setTimeout(() => {
    const metrics = syncService.getMetrics();
    console.log('📊 Metrics:', metrics);
  }, 10000);
}
