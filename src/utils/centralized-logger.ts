/**
 * P0.2: CENTRALIZED LOGGING & OBSERVABILITY
 *
 * Unified structured logging for all 9 microservices
 * Supports correlation IDs, log levels, and centralized collection
 */

import fs from "fs";
import path from "path";

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4,
}

export interface LogEntry {
  timestamp: string;
  level: string;
  service: string;
  correlation_id?: string;
  trace_id?: string; // P1.1: OpenTelemetry trace ID
  span_id?: string; // P1.1: OpenTelemetry span ID
  message: string;
  metadata?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export class CentralizedLogger {
  private service_name: string;
  private min_level: LogLevel;
  private log_file_path?: string;
  private console_enabled: boolean;

  constructor(
    service_name: string,
    options: {
      min_level?: LogLevel;
      log_to_file?: boolean;
      console_enabled?: boolean;
    } = {}
  ) {
    this.service_name = service_name;
    this.min_level = options.min_level ?? LogLevel.INFO;
    this.console_enabled = options.console_enabled ?? true;

    if (options.log_to_file) {
      const logDir = path.join(process.cwd(), "logs");
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      this.log_file_path = path.join(
        logDir,
        `${service_name}-${new Date().toISOString().split("T")[0]}.jsonl`
      );
    }
  }

  private log(
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>,
    error?: Error
  ): void {
    if (level < this.min_level) return;

    // P1.1: Include OpenTelemetry trace IDs for log/trace correlation
    let trace_id: string | undefined;
    let span_id: string | undefined;
    try {
      const { getTraceIds } = require("./otel-tracer");
      const traceIds = getTraceIds();
      trace_id = traceIds.traceId;
      span_id = traceIds.spanId;
    } catch {
      // OTel not initialized, continue without trace IDs
    }

    const correlationId = this.getCorrelationId();
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      service: this.service_name,
      ...(correlationId && { correlation_id: correlationId }),
      ...(trace_id && { trace_id }),
      ...(span_id && { span_id }),
      message,
      ...(metadata && { metadata }),
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        ...(error.stack && { stack: error.stack }),
      };
    }

    // Write to file (append as JSONL)
    if (this.log_file_path) {
      fs.appendFileSync(this.log_file_path, JSON.stringify(entry) + "\n");
    }

    // Write to console
    if (this.console_enabled) {
      const emoji = this.getLevelEmoji(level);
      const coloredLevel = this.colorizeLevel(level);
      console.log(
        `${emoji} [${entry.timestamp}] [${this.service_name}] ${coloredLevel}: ${message}`,
        metadata ? JSON.stringify(metadata) : ""
      );
      if (error) {
        console.error(error.stack);
      }
    }
  }

  public debug(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  public info(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  public warn(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  public error(
    message: string,
    error?: Error,
    metadata?: Record<string, any>
  ): void {
    this.log(LogLevel.ERROR, message, metadata, error);
  }

  public critical(
    message: string,
    error?: Error,
    metadata?: Record<string, any>
  ): void {
    this.log(LogLevel.CRITICAL, message, metadata, error);
  }

  /**
   * Get correlation ID from environment (set by orchestrator or API gateway)
   */
  private getCorrelationId(): string | undefined {
    return process.env.CORRELATION_ID || undefined;
  }

  /**
   * Get emoji for log level
   */
  private getLevelEmoji(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return "🔍";
      case LogLevel.INFO:
        return "ℹ️";
      case LogLevel.WARN:
        return "⚠️";
      case LogLevel.ERROR:
        return "❌";
      case LogLevel.CRITICAL:
        return "🚨";
    }
  }

  /**
   * Colorize log level for console output
   */
  private colorizeLevel(level: LogLevel): string {
    const levelName = LogLevel[level];
    switch (level) {
      case LogLevel.DEBUG:
        return `\x1b[36m${levelName}\x1b[0m`; // Cyan
      case LogLevel.INFO:
        return `\x1b[32m${levelName}\x1b[0m`; // Green
      case LogLevel.WARN:
        return `\x1b[33m${levelName}\x1b[0m`; // Yellow
      case LogLevel.ERROR:
        return `\x1b[31m${levelName}\x1b[0m`; // Red
      case LogLevel.CRITICAL:
        return `\x1b[35m${levelName}\x1b[0m`; // Magenta
    }
  }

  /**
   * Create child logger with correlation ID
   */
  public child(correlation_id: string): CentralizedLogger {
    const child = new CentralizedLogger(this.service_name, {
      min_level: this.min_level,
      console_enabled: this.console_enabled,
    });
    process.env.CORRELATION_ID = correlation_id;
    return child;
  }
}

/**
 * Factory function to create logger for each service
 */
export function createLogger(service_name: string): CentralizedLogger {
  return new CentralizedLogger(service_name, {
    min_level:
      process.env.LOG_LEVEL === "DEBUG" ? LogLevel.DEBUG : LogLevel.INFO,
    log_to_file: process.env.LOG_TO_FILE === "true",
    console_enabled: true,
  });
}

/**
 * Performance tracking decorator
 */
export function logPerformance(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const start = Date.now();
    try {
      const result = await originalMethod.apply(this, args);
      const duration = Date.now() - start;

      if ((this as any).logger) {
        ((this as any).logger as CentralizedLogger).info(
          `Method ${propertyKey} completed`,
          { duration_ms: duration }
        );
      }

      return result;
    } catch (error) {
      const duration = Date.now() - start;

      if ((this as any).logger) {
        ((this as any).logger as CentralizedLogger).error(
          `Method ${propertyKey} failed`,
          error as Error,
          { duration_ms: duration }
        );
      }

      throw error;
    }
  };

  return descriptor;
}
