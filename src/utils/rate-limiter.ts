/**
 * API Rate Limit Monitor
 * Monitors and tracks API rate limits across providers
 *
 * @package utils
 * @author JARVIS
 * @version 1.0.0
 */

import { metrics } from "./metrics";
import { createLogger } from "./logger";

const logger = createLogger("rate-limit-monitor");

export interface RateLimitConfig {
  provider: string;
  requestsPerMinute: number;
  requestsPerHour?: number;
  requestsPerDay?: number;
  burstLimit?: number;
}

export interface RateLimitStatus {
  provider: string;
  currentMinute: number;
  currentHour: number;
  currentDay: number;
  limitsMinute: number;
  limitsHour?: number;
  limitsDay?: number;
  resetAt: Date;
  throttled: boolean;
}

export class RateLimitMonitor {
  private configs: Map<string, RateLimitConfig> = new Map();
  private minuteCounts: Map<string, { count: number; resetAt: number }> =
    new Map();
  private hourCounts: Map<string, { count: number; resetAt: number }> =
    new Map();
  private dayCounts: Map<string, { count: number; resetAt: number }> =
    new Map();

  // Register rate limit configuration
  registerProvider(config: RateLimitConfig): void {
    this.configs.set(config.provider, config);
    logger.info(`Registered rate limit for ${config.provider}`, {
      rpm: config.requestsPerMinute,
      rph: config.requestsPerHour,
      rpd: config.requestsPerDay,
    });
  }

  // Check if request is allowed
  canMakeRequest(provider: string): boolean {
    const config = this.configs.get(provider);
    if (!config) {
      logger.warn(`No rate limit config for provider: ${provider}`);
      return true; // Allow if not configured
    }

    const now = Date.now();

    // Check minute limit
    const minuteData = this.getOrCreateCounter(
      this.minuteCounts,
      provider,
      now,
      60 * 1000
    );
    if (minuteData.count >= config.requestsPerMinute) {
      logger.warn(`Rate limit exceeded for ${provider} (minute)`, {
        current: minuteData.count,
        limit: config.requestsPerMinute,
      });
      metrics.incrementCounter("rate_limit_exceeded_total", 1, {
        provider,
        window: "minute",
      });
      return false;
    }

    // Check hour limit
    if (config.requestsPerHour) {
      const hourData = this.getOrCreateCounter(
        this.hourCounts,
        provider,
        now,
        60 * 60 * 1000
      );
      if (hourData.count >= config.requestsPerHour) {
        logger.warn(`Rate limit exceeded for ${provider} (hour)`, {
          current: hourData.count,
          limit: config.requestsPerHour,
        });
        metrics.incrementCounter("rate_limit_exceeded_total", 1, {
          provider,
          window: "hour",
        });
        return false;
      }
    }

    // Check day limit
    if (config.requestsPerDay) {
      const dayData = this.getOrCreateCounter(
        this.dayCounts,
        provider,
        now,
        24 * 60 * 60 * 1000
      );
      if (dayData.count >= config.requestsPerDay) {
        logger.warn(`Rate limit exceeded for ${provider} (day)`, {
          current: dayData.count,
          limit: config.requestsPerDay,
        });
        metrics.incrementCounter("rate_limit_exceeded_total", 1, {
          provider,
          window: "day",
        });
        return false;
      }
    }

    return true;
  }

  // Record a request
  recordRequest(provider: string): void {
    const now = Date.now();

    // Increment all counters
    this.incrementCounter(this.minuteCounts, provider, now, 60 * 1000);
    this.incrementCounter(this.hourCounts, provider, now, 60 * 60 * 1000);
    this.incrementCounter(this.dayCounts, provider, now, 24 * 60 * 60 * 1000);

    // Update metrics
    metrics.incrementCounter("api_requests_total", 1, { provider });

    const status = this.getStatus(provider);
    metrics.setGauge("api_requests_minute", status.currentMinute, { provider });
    metrics.setGauge("api_requests_hour", status.currentHour, { provider });
    metrics.setGauge("api_requests_day", status.currentDay, { provider });
  }

  // Get current status
  getStatus(provider: string): RateLimitStatus {
    const config = this.configs.get(provider);
    const now = Date.now();

    const minuteData = this.minuteCounts.get(provider) || {
      count: 0,
      resetAt: now + 60 * 1000,
    };
    const hourData = this.hourCounts.get(provider) || {
      count: 0,
      resetAt: now + 60 * 60 * 1000,
    };
    const dayData = this.dayCounts.get(provider) || {
      count: 0,
      resetAt: now + 24 * 60 * 60 * 1000,
    };

    return {
      provider,
      currentMinute: minuteData.count,
      currentHour: hourData.count,
      currentDay: dayData.count,
      limitsMinute: config?.requestsPerMinute || 0,
      limitsHour: config?.requestsPerHour,
      limitsDay: config?.requestsPerDay,
      resetAt: new Date(minuteData.resetAt),
      throttled: !this.canMakeRequest(provider),
    };
  }

  // Get status for all providers
  getAllStatus(): RateLimitStatus[] {
    return Array.from(this.configs.keys()).map((provider) =>
      this.getStatus(provider)
    );
  }

  // Helper methods
  private getOrCreateCounter(
    map: Map<string, { count: number; resetAt: number }>,
    provider: string,
    now: number,
    window: number
  ): { count: number; resetAt: number } {
    const existing = map.get(provider);

    // Reset if window expired
    if (existing && existing.resetAt <= now) {
      existing.count = 0;
      existing.resetAt = now + window;
    }

    // Create if doesn't exist
    if (!existing) {
      const newCounter = { count: 0, resetAt: now + window };
      map.set(provider, newCounter);
      return newCounter;
    }

    return existing;
  }

  private incrementCounter(
    map: Map<string, { count: number; resetAt: number }>,
    provider: string,
    now: number,
    window: number
  ): void {
    const counter = this.getOrCreateCounter(map, provider, now, window);
    counter.count++;
  }

  // Calculate wait time until next available slot
  getWaitTime(provider: string): number {
    if (this.canMakeRequest(provider)) {
      return 0;
    }

    const minuteData = this.minuteCounts.get(provider);
    if (minuteData) {
      return Math.max(0, minuteData.resetAt - Date.now());
    }

    return 0;
  }

  // Reset counters for a provider
  reset(provider: string): void {
    this.minuteCounts.delete(provider);
    this.hourCounts.delete(provider);
    this.dayCounts.delete(provider);
    logger.info(`Reset rate limits for ${provider}`);
  }

  // Reset all counters
  resetAll(): void {
    this.minuteCounts.clear();
    this.hourCounts.clear();
    this.dayCounts.clear();
    logger.info("Reset all rate limits");
  }
}

// Global rate limit monitor
export const rateLimitMonitor = new RateLimitMonitor();

// Standard provider configurations
export const standardRateLimits: RateLimitConfig[] = [
  {
    provider: "openai",
    requestsPerMinute: 500,
    requestsPerDay: 10000,
  },
  {
    provider: "anthropic",
    requestsPerMinute: 50,
    requestsPerDay: 1000,
  },
  {
    provider: "google",
    requestsPerMinute: 60,
    requestsPerHour: 1500,
  },
  {
    provider: "groq",
    requestsPerMinute: 30,
    requestsPerDay: 14400,
  },
  {
    provider: "github",
    requestsPerMinute: 30,
    requestsPerHour: 5000,
  },
];

// Initialize standard rate limits
export function initializeStandardRateLimits(): void {
  standardRateLimits.forEach((config) =>
    rateLimitMonitor.registerProvider(config)
  );
  logger.info("Initialized standard rate limits", {
    providers: standardRateLimits.map((c) => c.provider),
  });
}
