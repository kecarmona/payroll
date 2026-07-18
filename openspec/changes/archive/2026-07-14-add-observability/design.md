# Design: Add Observability

## Shared Library

```
libs/observability/
  src/lib/
    metrics.service.ts        — Wraps prom-client, provides metric helpers
    metrics.controller.ts     — GET /api/metrics endpoint
    http-interceptor.ts       — Records HTTP request count + duration
    observability.module.ts   — Global module exporting MetricsService
```

## Implementation

### MetricsService
- Uses `prom-client` register
- Pre-registers standard metrics (http_requests_total, http_request_duration_ms, etc.)
- Provides `incrementHttpRequest()`, `observeHttpDuration()`, etc.

### HTTP Interceptor
- NestJS interceptor that records request count + duration
- Uses CorrelationIdMiddleware.getCorrelationId() for correlation

### Kafka Consumer Metrics
- Instrument the Kafka consumer to record messages consumed + processing duration
- Hook into the existing consumer pattern

### Outbox Metrics
- Add a query to count pending outbox records (publishedAt IS NULL)
- Expose via Gauge metric

## Service Wiring

Each service adds:
- `ObservabilityModule` to imports
- `MetricsController` to controllers
- Global interceptor for HTTP metrics
