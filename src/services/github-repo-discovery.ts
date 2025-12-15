// src/services/github-repo-discovery.ts
// GitHub API integration for automatic repository discovery

import { Octokit } from "octokit";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export interface Repository {
  name: string;
  full_name: string;
  private: boolean;
  archived: boolean;
  fork: boolean;
  created_at: string;
  updated_at: string;
  clone_url: string;
  ssh_url: string;
}

export interface DiscoveryConfig {
  organization: string;
  includeArchived: boolean;
  includePrivate: boolean;
  excludeRepos: string[];
}

export interface CacheData {
  repositories: Repository[];
  lastFetch: string;
  organization: string;
}

const CACHE_DIR = path.join(os.homedir(), ".infinity-x-one");
const CACHE_FILE = path.join(CACHE_DIR, "repo-cache.json");
const CACHE_TTL_HOURS = 1; // Cache for 1 hour

export class GitHubRepoDiscovery {
  private octokit: Octokit;
  private config: DiscoveryConfig;

  constructor(token: string, config: DiscoveryConfig) {
    this.octokit = new Octokit({ auth: token });
    this.config = config;
  }

  /**
   * Get cached repositories if still valid
   */
  private getCachedRepos(): Repository[] | null {
    try {
      if (!fs.existsSync(CACHE_FILE)) {
        return null;
      }

      const cacheData: CacheData = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
      
      // Check if cache is still valid
      const lastFetch = new Date(cacheData.lastFetch);
      const now = new Date();
      const hoursSinceLastFetch = (now.getTime() - lastFetch.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastFetch < CACHE_TTL_HOURS && cacheData.organization === this.config.organization) {
        console.log(`📦 Using cached repository list (${cacheData.repositories.length} repos)`);
        return cacheData.repositories;
      }

      return null;
    } catch (error) {
      console.debug("Cache read error:", error);
      return null;
    }
  }

  /**
   * Save repositories to cache
   */
  private cacheRepos(repos: Repository[]): void {
    try {
      // Ensure cache directory exists
      if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
      }

      const cacheData: CacheData = {
        repositories: repos,
        lastFetch: new Date().toISOString(),
        organization: this.config.organization,
      };

      fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheData, null, 2));
      console.log(`💾 Cached ${repos.length} repositories`);
    } catch (error) {
      console.debug("Cache write error:", error);
    }
  }

  /**
   * Fetch all repositories from GitHub organization with pagination
   */
  async discoverRepositories(forceRefresh = false): Promise<Repository[]> {
    // Try cache first unless force refresh
    if (!forceRefresh) {
      const cached = this.getCachedRepos();
      if (cached) {
        return this.filterRepositories(cached);
      }
    }

    console.log(`🔍 Discovering repositories in ${this.config.organization}...`);

    try {
      const repos: Repository[] = [];
      let page = 1;
      const perPage = 100;

      // Fetch all pages
      while (true) {
        console.log(`  Fetching page ${page}...`);
        
        const response = await this.octokit.rest.repos.listForOrg({
          org: this.config.organization,
          type: "all",
          per_page: perPage,
          page: page,
        });

        if (response.data.length === 0) {
          break;
        }

        // Map to our Repository interface
        const pageRepos: Repository[] = response.data.map((repo) => ({
          name: repo.name,
          full_name: repo.full_name,
          private: repo.private,
          archived: repo.archived || false,
          fork: repo.fork,
          created_at: repo.created_at || "",
          updated_at: repo.updated_at || "",
          clone_url: repo.clone_url || "",
          ssh_url: repo.ssh_url || "",
        }));

        repos.push(...pageRepos);

        // Check if there are more pages
        if (response.data.length < perPage) {
          break;
        }

        page++;

        // Rate limit protection - small delay between pages
        await this.sleep(100);
      }

      console.log(`✅ Discovered ${repos.length} total repositories`);

      // Cache the results
      this.cacheRepos(repos);

      // Apply filters
      return this.filterRepositories(repos);
    } catch (error) {
      if (error instanceof Error) {
        if ("status" in error && (error as { status: number }).status === 403) {
          console.error("❌ GitHub API rate limit exceeded. Please wait and try again.");
          throw new Error("GitHub API rate limit exceeded");
        }
        console.error("❌ Failed to discover repositories:", error.message);
      }
      throw error;
    }
  }

  /**
   * Filter repositories based on configuration
   */
  private filterRepositories(repos: Repository[]): Repository[] {
    let filtered = repos;

    // Filter archived
    if (!this.config.includeArchived) {
      filtered = filtered.filter((repo) => !repo.archived);
    }

    // Filter private
    if (!this.config.includePrivate) {
      filtered = filtered.filter((repo) => !repo.private);
    }

    // Filter excluded repos
    if (this.config.excludeRepos.length > 0) {
      filtered = filtered.filter((repo) => !this.config.excludeRepos.includes(repo.name));
    }

    console.log(`📋 Filtered to ${filtered.length} repositories`);
    return filtered;
  }

  /**
   * Sleep utility for rate limiting
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get rate limit status
   */
  async getRateLimitStatus(): Promise<{ limit: number; remaining: number; reset: Date }> {
    const response = await this.octokit.rest.rateLimit.get();
    return {
      limit: response.data.rate.limit,
      remaining: response.data.rate.remaining,
      reset: new Date(response.data.rate.reset * 1000),
    };
  }

  /**
   * Check if we're approaching rate limit
   */
  async checkRateLimit(): Promise<boolean> {
    try {
      const status = await this.getRateLimitStatus();
      console.log(`⚡ Rate limit: ${status.remaining}/${status.limit} (resets at ${status.reset.toLocaleTimeString()})`);
      
      if (status.remaining < 10) {
        console.warn("⚠️  Approaching GitHub API rate limit!");
        return false;
      }
      return true;
    } catch (error) {
      console.debug("Failed to check rate limit:", error);
      return true;
    }
  }

  /**
   * Clear the cache
   */
  static clearCache(): void {
    try {
      if (fs.existsSync(CACHE_FILE)) {
        fs.unlinkSync(CACHE_FILE);
        console.log("🗑️  Cache cleared");
      }
    } catch (error) {
      console.debug("Failed to clear cache:", error);
    }
  }
}
