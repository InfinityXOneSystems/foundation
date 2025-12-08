/**
 * Prometheus Metrics Exporter
 * Provides metrics collection and export for monitoring
 *
 * @package utils
 * @author JARVIS
 * @version 1.0.0
 */

import * as http from "http";

export interface Counter {
  name: string;
  help: string;
  value: number;
  labels?: Record<string, string>;
}

export interface Gauge {
  name: string;
  help: string;
  value: number;
  labels?: Record<string, string>;
}

export interface Histogram {
  name: string;
  help: string;
  buckets: number[];
  counts: number[];
  sum: number;
  count: number;
  labels?: Record<string, string>;
}

export class MetricsCollector {
  private counters: Map<string, Counter> = new Map();
  private gauges: Map<string, Gauge> = new Map();
  private histograms: Map<string, Histogram> = new Map();

  // Counter operations
  incrementCounter(
    name: string,
    value: number = 1,
    labels?: Record<string, string>
  ): void {
    const key = this.getKey(name, labels);
    const counter = this.counters.get(key);

    if (counter) {
      counter.value += value;
    } else {
      this.counters.set(key, {
        name,
        help: `Counter for ${name}`,
        value,
        labels,
      });
    }
  }

  getCounter(name: string, labels?: Record<string, string>): number {
    const key = this.getKey(name, labels);
    return this.counters.get(key)?.value || 0;
  }

  // Gauge operations
  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.getKey(name, labels);
    this.gauges.set(key, {
      name,
      help: `Gauge for ${name}`,
      value,
      labels,
    });
  }

  incrementGauge(
    name: string,
    value: number = 1,
    labels?: Record<string, string>
  ): void {
    const key = this.getKey(name, labels);
    const gauge = this.gauges.get(key);

    if (gauge) {
      gauge.value += value;
    } else {
      this.setGauge(name, value, labels);
    }
  }

  decrementGauge(
    name: string,
    value: number = 1,
    labels?: Record<string, string>
  ): void {
    this.incrementGauge(name, -value, labels);
  }

  getGauge(name: string, labels?: Record<string, string>): number {
    const key = this.getKey(name, labels);
    return this.gauges.get(key)?.value || 0;
  }

  // Histogram operations
  observeHistogram(
    name: string,
    value: number,
    labels?: Record<string, string>
  ): void {
    const key = this.getKey(name, labels);
    let histogram = this.histograms.get(key);

    if (!histogram) {
      histogram = {
        name,
        help: `Histogram for ${name}`,
        buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
        counts: new Array(12).fill(0),
        sum: 0,
        count: 0,
        labels,
      };
      this.histograms.set(key, histogram);
    }

    histogram.sum += value;
    histogram.count++;

    // Update bucket counts
    for (let i = 0; i < histogram.buckets.length; i++) {
      if (value <= histogram.buckets[i]) {
        histogram.counts[i]++;
      }
    }
    histogram.counts[histogram.counts.length - 1]++; // +Inf bucket
  }

  // Helper methods
  private getKey(name: string, labels?: Record<string, string>): string {
    if (!labels) return name;
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(",");
    return `${name}{${labelStr}}`;
  }

  // Export metrics in Prometheus format
  exportMetrics(): string {
    const lines: string[] = [];

    // Export counters
    const countersByName = new Map<string, Counter[]>();
    this.counters.forEach((counter) => {
      if (!countersByName.has(counter.name)) {
        countersByName.set(counter.name, []);
      }
      countersByName.get(counter.name)!.push(counter);
    });

    countersByName.forEach((counters, name) => {
      lines.push(`# HELP ${name} ${counters[0].help}`);
      lines.push(`# TYPE ${name} counter`);
      counters.forEach((counter) => {
        const labels = counter.labels
          ? `{${Object.entries(counter.labels)
              .map(([k, v]) => `${k}="${v}"`)
              .join(",")}}`
          : "";
        lines.push(`${name}${labels} ${counter.value}`);
      });
    });

    // Export gauges
    const gaugesByName = new Map<string, Gauge[]>();
    this.gauges.forEach((gauge) => {
      if (!gaugesByName.has(gauge.name)) {
        gaugesByName.set(gauge.name, []);
      }
      gaugesByName.get(gauge.name)!.push(gauge);
    });

    gaugesByName.forEach((gauges, name) => {
      lines.push(`# HELP ${name} ${gauges[0].help}`);
      lines.push(`# TYPE ${name} gauge`);
      gauges.forEach((gauge) => {
        const labels = gauge.labels
          ? `{${Object.entries(gauge.labels)
              .map(([k, v]) => `${k}="${v}"`)
              .join(",")}}`
          : "";
        lines.push(`${name}${labels} ${gauge.value}`);
      });
    });

    // Export histograms
    const histogramsByName = new Map<string, Histogram[]>();
    this.histograms.forEach((histogram) => {
      if (!histogramsByName.has(histogram.name)) {
        histogramsByName.set(histogram.name, []);
      }
      histogramsByName.get(histogram.name)!.push(histogram);
    });

    histogramsByName.forEach((histograms, name) => {
      lines.push(`# HELP ${name} ${histograms[0].help}`);
      lines.push(`# TYPE ${name} histogram`);
      histograms.forEach((histogram) => {
        const baseLabels = histogram.labels
          ? Object.entries(histogram.labels)
              .map(([k, v]) => `${k}="${v}"`)
              .join(",")
          : "";

        // Bucket counts
        for (let i = 0; i < histogram.buckets.length; i++) {
          const le = histogram.buckets[i];
          const labels = baseLabels
            ? `{${baseLabels},le="${le}"}`
            : `{le="${le}"}`;
          lines.push(`${name}_bucket${labels} ${histogram.counts[i]}`);
        }

        // +Inf bucket
        const infLabels = baseLabels
          ? `{${baseLabels},le="+Inf"}`
          : `{le="+Inf"}`;
        lines.push(
          `${name}_bucket${infLabels} ${
            histogram.counts[histogram.counts.length - 1]
          }`
        );

        // Sum and count
        const sumLabels = baseLabels ? `{${baseLabels}}` : "";
        lines.push(`${name}_sum${sumLabels} ${histogram.sum}`);
        lines.push(`${name}_count${sumLabels} ${histogram.count}`);
      });
    });

    return lines.join("\n") + "\n";
  }

  // Reset all metrics
  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }
}

// Global metrics collector
export const metrics = new MetricsCollector();

// Standard application metrics
export function initializeStandardMetrics(service: string): void {
  metrics.setGauge("app_info", 1, { service, version: "1.0.0" });
  metrics.setGauge("app_start_time_seconds", Date.now() / 1000, { service });
}

// HTTP metrics helpers
export function recordHttpRequest(
  method: string,
  path: string,
  statusCode: number,
  durationMs: number
): void {
  metrics.incrementCounter("http_requests_total", 1, {
    method,
    path,
    status: statusCode.toString(),
  });
  metrics.observeHistogram("http_request_duration_seconds", durationMs / 1000, {
    method,
    path,
  });
}

// Create metrics endpoint
export function createMetricsServer(port: number): http.Server {
  const server = http.createServer((req, res) => {
    if (req.url === "/metrics" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end(metrics.exportMetrics());
    } else {
      res.writeHead(404);
      res.end("Not Found");
    }
  });

  server.listen(port);
  return server;
}
