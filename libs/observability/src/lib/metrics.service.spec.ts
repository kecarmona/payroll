import * as promClient from 'prom-client';
import { MetricsService } from './metrics.service';

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(() => {
    // Clear the global registry between tests to avoid metric name collisions
    promClient.register.clear();

    // Set a predictable service name for test assertions
    process.env['SERVICE_NAME'] = 'test-service';

    service = new MetricsService();
  });

  afterEach(() => {
    delete process.env['SERVICE_NAME'];
    promClient.register.clear();
    // Reset the static guard so the next test can re-register default metrics
    (MetricsService as any).defaultMetricsRegistered = false;
  });

  describe('incrementHttpRequest', () => {
    it('should increment the http_requests_total counter', async () => {
      service.incrementHttpRequest('GET', '/test', '200');

      const metrics = await service.getMetrics();
      expect(metrics).toContain('http_requests_total');
      expect(metrics).toContain('method="GET"');
      expect(metrics).toContain('path="/test"');
      expect(metrics).toContain('status="200"');
      expect(metrics).toContain('service="test-service"');
    });

    it('should increment the counter by 1 each call', async () => {
      service.incrementHttpRequest('POST', '/api/items', '201');
      service.incrementHttpRequest('POST', '/api/items', '201');

      const metrics = await service.getMetrics();
      const lines = metrics.split('\n').filter((l) => l.startsWith('http_requests_total'));
      // The counter line should end with " 2" (two increments)
      const counterLine = lines.find((l) => l.includes('POST'));
      expect(counterLine).toBeDefined();
      expect(counterLine).toMatch(/\s2$/);
    });

    it('should handle different status codes independently', async () => {
      service.incrementHttpRequest('GET', '/test', '200');
      service.incrementHttpRequest('GET', '/test', '500');

      const metrics = await service.getMetrics();
      const lines = metrics.split('\n').filter((l) => l.startsWith('http_requests_total'));

      expect(lines.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('observeHttpDuration', () => {
    it('should record a duration observation', async () => {
      service.observeHttpDuration('GET', '/test', '200', 42);

      const metrics = await service.getMetrics();
      expect(metrics).toContain('http_request_duration_ms');
      expect(metrics).toContain('method="GET"');
      expect(metrics).toContain('path="/test"');
      expect(metrics).toContain('status="200"');
    });
  });

  describe('incrementKafkaMessage', () => {
    it('should increment the kafka_messages_consumed_total counter', async () => {
      service.incrementKafkaMessage('payroll.events', 'PayrollJobCreated');

      const metrics = await service.getMetrics();
      expect(metrics).toContain('kafka_messages_consumed_total');
      expect(metrics).toContain('topic="payroll.events"');
      expect(metrics).toContain('event_type="PayrollJobCreated"');
    });
  });

  describe('observeKafkaProcessingDuration', () => {
    it('should record a kafka processing duration', async () => {
      service.observeKafkaProcessingDuration('payroll.events', 'PayslipGenerated', 150);

      const metrics = await service.getMetrics();
      expect(metrics).toContain('kafka_processing_duration_ms');
      expect(metrics).toContain('topic="payroll.events"');
      expect(metrics).toContain('event_type="PayslipGenerated"');
    });
  });

  describe('setOutboxPendingCount', () => {
    it('should set the outbox_pending_count gauge', async () => {
      service.setOutboxPendingCount(5);

      const metrics = await service.getMetrics();
      expect(metrics).toContain('outbox_pending_count');
      expect(metrics).toContain('service="test-service"');
    });
  });

  describe('incrementOutboxPublishFailures', () => {
    it('should increment the outbox_publish_failures_total counter', async () => {
      service.incrementOutboxPublishFailures();

      const metrics = await service.getMetrics();
      expect(metrics).toContain('outbox_publish_failures_total');
    });
  });

  describe('getMetrics', () => {
    it('should return Prometheus-formatted text', async () => {
      const result = await service.getMetrics();

      expect(typeof result).toBe('string');
      // Prometheus format includes HELP and TYPE lines
      expect(result).toContain('# HELP');
      expect(result).toContain('# TYPE');
    });
  });

  describe('service name resolution', () => {
    it('should use SERVICE_NAME when set', async () => {
      service.incrementHttpRequest('GET', '/test', '200');

      const metrics = await service.getMetrics();
      expect(metrics).toContain('service="test-service"');
    });

    it('should fall back to npm_package_name when SERVICE_NAME is not set', async () => {
      promClient.register.clear();
      delete process.env['SERVICE_NAME'];
      process.env['npm_package_name'] = 'npm-pkg';

      const svc = new MetricsService();
      svc.incrementHttpRequest('GET', '/fallback', '200');
      delete process.env['npm_package_name'];

      const metrics = await svc.getMetrics();
      expect(metrics).toContain('service="npm-pkg"');
    });

    it('should use "unknown" when neither env var is set', async () => {
      promClient.register.clear();
      delete process.env['SERVICE_NAME'];

      const svc = new MetricsService();
      svc.incrementHttpRequest('GET', '/unknown', '200');

      const metrics = await svc.getMetrics();
      expect(metrics).toContain('service="unknown"');
    });
  });

  describe('prometheus client integration', () => {
    it('should call collectDefaultMetrics during construction', async () => {
      // The constructor already ran in beforeEach, which called collectDefaultMetrics
      // Verify the registry has default metrics registered
      const metricsAsJson = await promClient.register.getMetricsAsJSON();
      const metricsTypes = metricsAsJson.map((m: any) => m.name);

      // Default metrics include nodejs_ prefixed items
      const hasDefaultMetrics = metricsTypes.some((name: string) =>
        name.startsWith('nodejs_'),
      );
      expect(hasDefaultMetrics).toBe(true);
    });
  });
});
