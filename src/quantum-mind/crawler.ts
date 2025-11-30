/**
 * Modular Crawler and Ingestion System
 * Web scraping, headless browser automation, multi-source data ingestion
 * 
 * @package quantum-mind
 * @author JARVIS
 * @version 1.0.0
 */

import { EventEmitter } from "events";
import { quantumEventBus } from "./event-bus";

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export type SourceType = "web" | "api" | "rss" | "document" | "database" | "stream";
export type CrawlStatus = "pending" | "crawling" | "completed" | "failed" | "paused";

export interface CrawlConfig {
  id: string;
  source_type: SourceType;
  url?: string;
  api_endpoint?: string;
  headless_browser?: boolean;
  selectors?: {
    content?: string;
    title?: string;
    metadata?: string;
  };
  authentication?: {
    type: "bearer" | "api_key" | "oauth" | "basic";
    credentials: Record<string, string>;
  };
  rate_limit?: {
    requests_per_second: number;
    concurrent_requests: number;
  };
  javascript_rendering?: boolean;
  follow_links?: boolean;
  max_depth?: number;
  filters?: {
    include_patterns?: string[];
    exclude_patterns?: string[];
  };
}

export interface CrawlResult {
  id: string;
  config_id: string;
  url?: string;
  title?: string;
  content: string;
  metadata: Record<string, unknown>;
  extracted_data: Record<string, unknown>;
  links: string[];
  crawled_at: string;
  processing_time_ms: number;
  status: "success" | "error";
  error?: string;
}

export interface IngestionJob {
  id: string;
  created_at: string;
  updated_at: string;
  config: CrawlConfig;
  status: CrawlStatus;
  results: CrawlResult[];
  stats: {
    total_pages: number;
    successful: number;
    failed: number;
    total_bytes: number;
    average_processing_ms: number;
  };
  schedule?: {
    interval_minutes: number;
    next_run: string;
  };
}

// ============================================================
// CRAWLER ENGINE
// ============================================================

export class CrawlerEngine extends EventEmitter {
  private jobs: Map<string, IngestionJob> = new Map();
  private active_crawls: Set<string> = new Set();
  private crawl_queue: CrawlConfig[] = [];

  constructor() {
    super();
  }

  /**
   * Create crawl job
   */
  public createJob(config: CrawlConfig, schedule?: { interval_minutes: number }): string {
    const job: IngestionJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      config,
      status: "pending",
      results: [],
      stats: {
        total_pages: 0,
        successful: 0,
        failed: 0,
        total_bytes: 0,
        average_processing_ms: 0,
      },
      ...(schedule
        ? {
            schedule: {
              interval_minutes: schedule.interval_minutes,
              next_run: new Date(Date.now() + schedule.interval_minutes * 60 * 1000).toISOString(),
            }
          }
        : {}),
    } as IngestionJob;

    this.jobs.set(job.id, job);

    this.emit("job_created", job);

    // Add to queue
    this.crawl_queue.push(config);
    this.processQueue();

    return job.id;
  }

  /**
   * Process crawl queue
   */
  private async processQueue(): Promise<void> {
    if (this.crawl_queue.length === 0) return;

    const config = this.crawl_queue.shift();
    if (!config) return;

    await this.executeCrawl(config);

    // Continue processing
    if (this.crawl_queue.length > 0) {
      setTimeout(() => this.processQueue(), 100);
    }
  }

  /**
   * Execute crawl
   */
  private async executeCrawl(config: CrawlConfig): Promise<void> {
    const job = Array.from(this.jobs.values()).find((j) => j.config.id === config.id);
    if (!job) return;

    this.active_crawls.add(job.id);
    job.status = "crawling";
    job.updated_at = new Date().toISOString();

    this.emit("crawl_started", { job_id: job.id, config });

    try {
      const result = await this.crawlSource(config);

      job.results.push(result);
      job.stats.total_pages++;
      job.stats.successful++;
      job.stats.total_bytes += result.content.length;
      job.stats.average_processing_ms =
        (job.stats.average_processing_ms * (job.stats.total_pages - 1) + result.processing_time_ms) /
        job.stats.total_pages;

      // Publish to event bus
      quantumEventBus.publish(
        "crawler_system",
        "data_scraped",
        {
          job_id: job.id,
          config_id: config.id,
          url: result.url,
          content: result.content,
          metadata: result.metadata,
          extracted_data: result.extracted_data,
        },
        "medium"
      );

      job.status = "completed";
    } catch (error) {
      job.stats.failed++;

      const err_msg = error instanceof Error ? error.message : String(error);

      job.results.push({
        id: `result_${Date.now()}`,
        config_id: config.id,
        content: "",
        metadata: {},
        extracted_data: {},
        links: [],
        crawled_at: new Date().toISOString(),
        processing_time_ms: 0,
        status: "error",
        error: err_msg,
      });

      job.status = "failed";

      this.emit("crawl_error", { job_id: job.id, error: err_msg });
    }

    this.active_crawls.delete(job.id);
    job.updated_at = new Date().toISOString();

    this.emit("crawl_completed", { job_id: job.id, stats: job.stats });
  }

  /**
   * Crawl source (placeholder for actual implementation)
   */
  private async crawlSource(config: CrawlConfig): Promise<CrawlResult> {
    const start_time = Date.now();

    // Simulate crawling
    await new Promise((resolve) => setTimeout(resolve, 100));

    // In real implementation:
    // - Use puppeteer/playwright for headless browser
    // - Use axios/got for API calls
    // - Use cheerio for HTML parsing
    // - Implement rate limiting
    // - Handle authentication

    const result = {
      id: `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      config_id: config.id,
      url: config.url || config.api_endpoint || "",
      title: `Crawled content from ${config.url || config.api_endpoint}`,
      content: `Sample content from ${config.source_type} source`,
      metadata: {
        source_type: config.source_type,
        crawled_with_headless: config.headless_browser || false,
      },
      extracted_data: {},
      links: [],
      crawled_at: new Date().toISOString(),
      processing_time_ms: Date.now() - start_time,
      status: "success" as const,
    } as CrawlResult;

    return result;
  }

  /**
   * Get job status
   */
  public getJob(job_id: string): IngestionJob | undefined {
    return this.jobs.get(job_id);
  }

  /**
   * Get all jobs
   */
  public getAllJobs(filter?: { status?: CrawlStatus }): IngestionJob[] {
    let jobs = Array.from(this.jobs.values());

    if (filter?.status) {
      jobs = jobs.filter((job) => job.status === filter.status);
    }

    return jobs;
  }

  /**
   * Pause job
   */
  public pauseJob(job_id: string): boolean {
    const job = this.jobs.get(job_id);
    if (!job) return false;

    if (job.status === "crawling") {
      job.status = "paused";
      job.updated_at = new Date().toISOString();
      this.emit("job_paused", { job_id });
      return true;
    }

    return false;
  }

  /**
   * Resume job
   */
  public resumeJob(job_id: string): boolean {
    const job = this.jobs.get(job_id);
    if (!job) return false;

    if (job.status === "paused") {
      job.status = "pending";
      job.updated_at = new Date().toISOString();
      this.crawl_queue.push(job.config);
      this.processQueue();
      this.emit("job_resumed", { job_id });
      return true;
    }

    return false;
  }
}

// ============================================================
// HEADLESS BROWSER AGENT
// ============================================================

export class HeadlessBrowserAgent extends EventEmitter {
  private browser_instances: Map<string, { id: string; status: "idle" | "busy"; created_at: string }> = new Map();

  constructor() {
    super();
  }

  /**
   * Navigate to URL and extract content
   */
  public async navigateAndExtract(
    url: string,
    selectors?: CrawlConfig["selectors"],
    javascript_rendering = true
  ): Promise<{
    content: string;
    title: string;
    metadata: Record<string, unknown>;
    screenshot?: string;
  }> {
    // In real implementation:
    // - Launch puppeteer/playwright browser
    // - Navigate to URL
    // - Wait for JavaScript rendering if enabled
    // - Extract content using selectors
    // - Take screenshot if requested
    // - Close browser

    return {
      content: `Extracted content from ${url}`,
      title: `Page Title`,
      metadata: {
        url,
        javascript_rendered: javascript_rendering,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Execute JavaScript in page context
   */
  public async executeScript(url: string, script: string): Promise<unknown> {
    // Execute custom JavaScript in browser context
    return { result: "script executed" };
  }
}

// ============================================================
// SCRAPER UTILITIES
// ============================================================

export class ScraperUtils {
  /**
   * Clean HTML content
   */
  public static cleanHTML(html: string): string {
    // Remove scripts, styles, comments
    // Extract text content
    // Normalize whitespace
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "");
  }

  /**
   * Extract metadata from HTML
   */
  public static extractMetadata(html: string): Record<string, string> {
    const metadata: Record<string, string> = {};

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch?.[1]) {
      metadata.title = titleMatch[1];
    }

    // Extract meta tags
    const metaMatches = html.matchAll(/<meta\s+(?:name|property)="([^"]+)"\s+content="([^"]+)"/gi);
    for (const match of metaMatches) {
      if (match[1] && match[2]) {
        metadata[match[1]] = match[2];
      }
    }

    return metadata;
  }

  /**
   * Extract links from HTML
   */
  public static extractLinks(html: string, base_url: string): string[] {
    const links: string[] = [];
    const linkMatches = html.matchAll(/<a\s+(?:[^>]*?\s+)?href="([^"]+)"/gi);

    for (const match of linkMatches) {
      const link = match[1];
      if (!link) continue;

      // Handle relative URLs
      let absoluteLink = link;
      if (!link.startsWith("http")) {
        const url = new URL(base_url);
        absoluteLink = new URL(link, url.origin).href;
      }

      links.push(absoluteLink);
    }

    return links;
  }
}

// Export instances
export const crawlerEngine = new CrawlerEngine();
export const headlessBrowserAgent = new HeadlessBrowserAgent();
