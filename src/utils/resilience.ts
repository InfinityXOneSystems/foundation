// src/utils/resilience.ts
// Resilience patterns: retry with exponential backoff, circuit breaker, timeout

export interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  timeoutMs: number;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelayMs: 2000,
  maxDelayMs: 30000,
  timeoutMs: 30000,
};

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error | unknown;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      // Add timeout to the function call
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), opts.timeoutMs)
        ),
      ]);
      return result;
    } catch (error) {
      lastError = error;
      const isLastAttempt = attempt === opts.maxRetries;

      if (isLastAttempt) {
        break;
      }

      // Calculate exponential backoff delay
      const delayMs = Math.min(
        opts.baseDelayMs * Math.pow(2, attempt),
        opts.maxDelayMs
      );

      console.warn(
        `Retry attempt ${attempt + 1}/${
          opts.maxRetries
        } failed. Retrying in ${delayMs}ms...`,
        error instanceof Error ? error.message : String(error)
      );

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

/**
 * Circuit breaker pattern to prevent cascading failures
 */
export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: "closed" | "open" | "half-open" = "closed";

  constructor(
    private readonly failureThreshold: number = 5,
    private readonly cooldownMs: number = 60000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === "open") {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure < this.cooldownMs) {
        throw new Error(
          `Circuit breaker is OPEN. Cooldown remaining: ${Math.ceil(
            (this.cooldownMs - timeSinceLastFailure) / 1000
          )}s`
        );
      }
      // Transition to half-open for a test request
      this.state = "half-open";
    }

    try {
      const result = await fn();
      // Success: reset circuit
      if (this.state === "half-open") {
        console.log("Circuit breaker recovered. State: CLOSED");
      }
      this.failureCount = 0;
      this.state = "closed";
      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.failureCount >= this.failureThreshold) {
        this.state = "open";
        console.error(
          `Circuit breaker tripped to OPEN after ${this.failureCount} failures. Cooldown: ${this.cooldownMs}ms`
        );
      }

      throw error;
    }
  }

  getState(): { state: string; failureCount: number } {
    return {
      state: this.state,
      failureCount: this.failureCount,
    };
  }
}
