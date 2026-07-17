import { Injectable } from '@nestjs/common';
import * as promClient from 'prom-client';

/**
 * Service that wraps prom-client to provide application-level metrics.
 *
 * Pre-defines counters, histograms, and gauges for HTTP requests,
 * Kafka message processing, and outbox health. Exposes a single
 * `/api/metrics` endpoint (via {@link MetricsController}) that returns
 * Prometheus-formatted text.
 */
@Injectable()
export class MetricsService {
  private readonly httpRequestsTotal: promClient.Counter<string>;
  private readonly httpRequestDurationMs: promClient.Histogram<string>;
  private readonly kafkaMessagesConsumedTotal: promClient.Counter<string>;
  private readonly kafkaProcessingDurationMs: promClient.Histogram<string>;
  private readonly outboxPendingCount: promClient.Gauge<string>;
  private readonly outboxPublishFailuresTotal: promClient.Counter<string>;

  /** Tracks whether default metrics have been registered to avoid double-registration errors. */
  private static defaultMetricsRegistered = false;

  constructor() {
    // Ensure the default metrics are registered only once across the application lifetime
    if (!MetricsService.defaultMetricsRegistered) {
      promClient.collectDefaultMetrics({ register: promClient.register });
      MetricsService.defaultMetricsRegistered = true;
    }

    this.httpRequestsTotal = new promClient.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'path', 'status', 'service'] as const,
    });

    this.httpRequestDurationMs = new promClient.Histogram({
      name: 'http_request_duration_ms',
      help: 'HTTP request duration in milliseconds',
      labelNames: ['method', 'path', 'status', 'service'] as const,
      buckets: [5, 10, 50, 100, 200, 500, 1000, 2000, 5000],
    });

    this.kafkaMessagesConsumedTotal = new promClient.Counter({
      name: 'kafka_messages_consumed_total',
      help: 'Total number of Kafka messages consumed',
      labelNames: ['topic', 'event_type', 'service'] as const,
    });

    this.kafkaProcessingDurationMs = new promClient.Histogram({
      name: 'kafka_processing_duration_ms',
      help: 'Kafka message processing duration in milliseconds',
      labelNames: ['topic', 'event_type', 'service'] as const,
      buckets: [5, 10, 50, 100, 200, 500, 1000, 2000, 5000],
    });

    this.outboxPendingCount = new promClient.Gauge({
      name: 'outbox_pending_count',
      help: 'Current number of pending outbox records',
      labelNames: ['service'] as const,
    });

    this.outboxPublishFailuresTotal = new promClient.Counter({
      name: 'outbox_publish_failures_total',
      help: 'Total number of outbox publish failures',
      labelNames: ['service'] as const,
    });
  }

  /**
   * Increments the HTTP request counter.
   *
   * @param method - HTTP method (GET, POST, PUT, DELETE, etc.)
   * @param path - Request path (e.g., /api/payroll-jobs)
   * @param status - HTTP response status code as string (e.g., '200', '500')
   */
  incrementHttpRequest(method: string, path: string, status: string): void {
    const service = this.resolveServiceName();
    this.httpRequestsTotal.inc({ method, path, status, service });
  }

  /**
   * Records an HTTP request duration observation.
   *
   * @param method - HTTP method
   * @param path - Request path
   * @param status - HTTP response status code as string
   * @param ms - Duration in milliseconds
   */
  observeHttpDuration(method: string, path: string, status: string, ms: number): void {
    const service = this.resolveServiceName();
    this.httpRequestDurationMs.observe({ method, path, status, service }, ms);
  }

  /**
   * Increments the Kafka message consumption counter.
   *
   * @param topic - Kafka topic name
   * @param eventType - Event type discriminator (e.g., PayrollJobCreated)
   */
  incrementKafkaMessage(topic: string, eventType: string): void {
    const service = this.resolveServiceName();
    this.kafkaMessagesConsumedTotal.inc({ topic, event_type: eventType, service });
  }

  /**
   * Records a Kafka processing duration observation.
   *
   * @param topic - Kafka topic name
   * @param eventType - Event type discriminator
   * @param ms - Processing duration in milliseconds
   */
  observeKafkaProcessingDuration(topic: string, eventType: string, ms: number): void {
    const service = this.resolveServiceName();
    this.kafkaProcessingDurationMs.observe({ topic, event_type: eventType, service }, ms);
  }

  /**
   * Sets the current outbox pending count.
   *
   * @param count - Number of pending outbox records
   */
  setOutboxPendingCount(count: number): void {
    const service = this.resolveServiceName();
    this.outboxPendingCount.set({ service }, count);
  }

  /**
   * Increments the outbox publish failure counter.
   */
  incrementOutboxPublishFailures(): void {
    const service = this.resolveServiceName();
    this.outboxPublishFailuresTotal.inc({ service });
  }

  /**
   * Returns all metrics in Prometheus exposition format.
   *
   * @returns A Promise resolving to the metrics string
   */
  async getMetrics(): Promise<string> {
    return promClient.register.metrics();
  }

  /**
   * Resolves the service name from the `SERVICE_NAME` environment variable,
   * falling back to the `npm_package_name` or `unknown` if neither is set.
   */
  private resolveServiceName(): string {
    return process.env['SERVICE_NAME']
      ?? process.env['npm_package_name']
      ?? 'unknown';
  }
}
