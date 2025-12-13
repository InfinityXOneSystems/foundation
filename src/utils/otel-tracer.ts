/**
 * P1.1: OPENTELEMETRY DISTRIBUTED TRACING
 *
 * Centralized tracer configuration for all 9 microservices
 * Traces the complete "Prompt → Production" pipeline
 */

import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import {
  trace,
  Span,
  SpanStatusCode,
  Context,
  context,
} from "@opentelemetry/api";
import { W3CTraceContextPropagator } from "@opentelemetry/core";

/**
 * Initialize OpenTelemetry SDK for a service
 */
export function initializeTracing(serviceName: string): NodeSDK {
  const otlpEndpoint =
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
    "http://localhost:4318/v1/traces";

  const sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: "1.0.0",
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]:
        process.env.NODE_ENV || "development",
    }),
    traceExporter: new OTLPTraceExporter({
      url: otlpEndpoint,
      headers: {
        // Add authentication if needed
        // 'Authorization': `Bearer ${process.env.OTEL_API_KEY}`
      },
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        // Auto-instrument HTTP, Express, fetch, etc.
        "@opentelemetry/instrumentation-http": {
          enabled: true,
        },
        "@opentelemetry/instrumentation-express": {
          enabled: true,
        },
        "@opentelemetry/instrumentation-fs": {
          enabled: false, // Too noisy for our use case
        },
      }),
    ],
    textMapPropagator: new W3CTraceContextPropagator(), // W3C Trace Context
  });

  sdk.start();

  // Graceful shutdown
  process.on("SIGTERM", () => {
    sdk
      .shutdown()
      .then(() => console.log("🔍 OpenTelemetry SDK shut down successfully"))
      .catch((error) => console.error("Error shutting down OTel SDK", error))
      .finally(() => process.exit(0));
  });

  console.log(`🔍 OpenTelemetry initialized for service: ${serviceName}`);
  console.log(`   Exporting to: ${otlpEndpoint}`);

  return sdk;
}

/**
 * Get the global tracer for manual span creation
 */
export function getTracer(serviceName: string) {
  return trace.getTracer(serviceName, "1.0.0");
}

/**
 * Create a manual span with automatic error handling
 */
export async function withSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T> {
  const tracer = trace.getTracer("auto-all");
  const span = tracer.startSpan(name);

  // Add custom attributes
  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      span.setAttribute(key, value);
    });
  }

  try {
    const result = await context.with(
      trace.setSpan(context.active(), span),
      async () => {
        return await fn(span);
      }
    );

    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    span.recordException(error as Error);
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Extract trace context from HTTP headers (for Gateway/API)
 */
export function extractTraceContext(headers: Record<string, string>): Context {
  const propagator = new W3CTraceContextPropagator();
  return propagator.extract(context.active(), headers, {
    get: (carrier, key) => carrier[key],
    keys: (carrier) => Object.keys(carrier),
  });
}

/**
 * Inject trace context into HTTP headers (for service-to-service calls)
 */
export function injectTraceContext(headers: Record<string, string>): void {
  const propagator = new W3CTraceContextPropagator();
  propagator.inject(context.active(), headers, {
    set: (carrier, key, value) => {
      carrier[key] = value;
    },
  });
}

/**
 * Get current trace ID and span ID for logging correlation
 */
export function getTraceIds(): {
  traceId?: string;
  spanId?: string;
} {
  const span = trace.getActiveSpan();
  if (!span) {
    return {};
  }

  const spanContext = span.spanContext();
  return {
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
  };
}

/**
 * Decorator for automatic span creation on class methods
 */
export function Traced(spanName?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const name = spanName || `${target.constructor.name}.${propertyKey}`;
      return withSpan(name, async (span) => {
        span.setAttribute("method", propertyKey);
        span.setAttribute("class", target.constructor.name);
        return await originalMethod.apply(this, args);
      });
    };

    return descriptor;
  };
}
