/**
 * Enhanced Health Check System
 * Provides detailed health status for all services
 *
 * @package utils
 * @author JARVIS
 * @version 1.0.0
 */

export type HealthStatus = "healthy" | "degraded" | "unhealthy";

export interface HealthCheckResult {
  status: HealthStatus;
  message?: string;
  duration_ms?: number;
  last_check?: string;
}

export interface ServiceHealth {
  service: string;
  status: HealthStatus;
  version: string;
  uptime_seconds: number;
  checks: Record<string, HealthCheckResult>;
  metadata?: Record<string, unknown>;
}

export type HealthCheckFunction = () => Promise<HealthCheckResult>;

export class HealthChecker {
  private service: string;
  private version: string;
  private startTime: number;
  private checks: Map<string, HealthCheckFunction> = new Map();
  private lastResults: Map<string, HealthCheckResult> = new Map();

  constructor(service: string, version: string = "1.0.0") {
    this.service = service;
    this.version = version;
    this.startTime = Date.now();
  }

  // Register health checks
  registerCheck(name: string, checkFn: HealthCheckFunction): void {
    this.checks.set(name, checkFn);
  }

  // Common health checks
  registerDatabaseCheck(
    name: string,
    testConnection: () => Promise<boolean>
  ): void {
    this.registerCheck(name, async () => {
      const start = Date.now();
      try {
        const connected = await testConnection();
        return {
          status: connected ? "healthy" : "unhealthy",
          message: connected
            ? "Database connected"
            : "Database connection failed",
          duration_ms: Date.now() - start,
          last_check: new Date().toISOString(),
        };
      } catch (error: any) {
        return {
          status: "unhealthy",
          message: `Database error: ${error.message}`,
          duration_ms: Date.now() - start,
          last_check: new Date().toISOString(),
        };
      }
    });
  }

  registerApiCheck(name: string, endpoint: string): void {
    this.registerCheck(name, async () => {
      const start = Date.now();
      try {
        const response = await fetch(endpoint, {
          method: "GET",
          signal: AbortSignal.timeout(5000),
        });
        const healthy = response.ok;
        return {
          status: healthy ? "healthy" : "degraded",
          message: `API returned ${response.status}`,
          duration_ms: Date.now() - start,
          last_check: new Date().toISOString(),
        };
      } catch (error: any) {
        return {
          status: "unhealthy",
          message: `API error: ${error.message}`,
          duration_ms: Date.now() - start,
          last_check: new Date().toISOString(),
        };
      }
    });
  }

  registerDiskSpaceCheck(
    name: string,
    path: string,
    threshold: number = 0.9
  ): void {
    this.registerCheck(name, async () => {
      const start = Date.now();
      try {
        // Note: Actual disk space check would require fs.statfs or similar
        // This is a placeholder implementation
        const usage = 0.5; // Mock value
        const healthy = usage < threshold;
        return {
          status: healthy ? "healthy" : "degraded",
          message: `Disk usage: ${(usage * 100).toFixed(1)}%`,
          duration_ms: Date.now() - start,
          last_check: new Date().toISOString(),
        };
      } catch (error: any) {
        return {
          status: "unhealthy",
          message: `Disk check error: ${error.message}`,
          duration_ms: Date.now() - start,
          last_check: new Date().toISOString(),
        };
      }
    });
  }

  registerMemoryCheck(name: string, threshold: number = 0.9): void {
    this.registerCheck(name, async () => {
      const start = Date.now();
      try {
        const used = process.memoryUsage();
        const heapUsage = used.heapUsed / used.heapTotal;
        const healthy = heapUsage < threshold;
        return {
          status: healthy ? "healthy" : "degraded",
          message: `Heap usage: ${(heapUsage * 100).toFixed(1)}%`,
          duration_ms: Date.now() - start,
          last_check: new Date().toISOString(),
        };
      } catch (error: any) {
        return {
          status: "unhealthy",
          message: `Memory check error: ${error.message}`,
          duration_ms: Date.now() - start,
          last_check: new Date().toISOString(),
        };
      }
    });
  }

  // Run all health checks
  async runChecks(): Promise<ServiceHealth> {
    const results: Record<string, HealthCheckResult> = {};
    let overallStatus: HealthStatus = "healthy";

    for (const [name, checkFn] of this.checks) {
      try {
        const result = await checkFn();
        results[name] = result;
        this.lastResults.set(name, result);

        // Determine overall status
        if (result.status === "unhealthy") {
          overallStatus = "unhealthy";
        } else if (
          result.status === "degraded" &&
          overallStatus === "healthy"
        ) {
          overallStatus = "degraded";
        }
      } catch (error: any) {
        const errorResult: HealthCheckResult = {
          status: "unhealthy",
          message: `Check failed: ${error.message}`,
          last_check: new Date().toISOString(),
        };
        results[name] = errorResult;
        this.lastResults.set(name, errorResult);
        overallStatus = "unhealthy";
      }
    }

    return {
      service: this.service,
      status: overallStatus,
      version: this.version,
      uptime_seconds: Math.floor((Date.now() - this.startTime) / 1000),
      checks: results,
    };
  }

  // Get last results without running checks
  getLastResults(): ServiceHealth {
    const results: Record<string, HealthCheckResult> = {};
    let overallStatus: HealthStatus = "healthy";

    for (const [name, result] of this.lastResults) {
      results[name] = result;
      if (result.status === "unhealthy") {
        overallStatus = "unhealthy";
      } else if (result.status === "degraded" && overallStatus === "healthy") {
        overallStatus = "degraded";
      }
    }

    return {
      service: this.service,
      status: overallStatus,
      version: this.version,
      uptime_seconds: Math.floor((Date.now() - this.startTime) / 1000),
      checks: results,
    };
  }

  // Simple liveness check
  isAlive(): boolean {
    return true;
  }

  // Readiness check based on health status
  isReady(): boolean {
    const health = this.getLastResults();
    return health.status !== "unhealthy";
  }
}

// Create health check endpoint handler
export function createHealthHandler(checker: HealthChecker) {
  return async (req: any, res: any) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);

    if (url.pathname === "/health" || url.pathname === "/healthz") {
      const health = await checker.runChecks();
      const statusCode =
        health.status === "healthy"
          ? 200
          : health.status === "degraded"
          ? 200
          : 503;
      res.writeHead(statusCode, { "Content-Type": "application/json" });
      res.end(JSON.stringify(health, null, 2));
    } else if (url.pathname === "/health/live" || url.pathname === "/livez") {
      const alive = checker.isAlive();
      res.writeHead(alive ? 200 : 503, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: alive ? "alive" : "dead" }));
    } else if (url.pathname === "/health/ready" || url.pathname === "/readyz") {
      const ready = checker.isReady();
      res.writeHead(ready ? 200 : 503, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: ready ? "ready" : "not ready" }));
    } else {
      res.writeHead(404);
      res.end("Not Found");
    }
  };
}
