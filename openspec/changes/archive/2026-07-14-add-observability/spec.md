# Spec: Add Observability

## 1. Shared Metrics Library (`libs/observability/`)

### MetricsService
- Wraps `prom-client` (Counter, Histogram, Gauge)
- Exposes metrics endpoint handler
- Provides standard metric definitions

### Metrics per Service
| Metric | Type | Labels | Description |
|---|---|---|---|
| http_requests_total | Counter | method, path, status, service | Total HTTP requests |
| http_request_duration_ms | Histogram | method, path, status, service | Request duration in ms |
| kafka_messages_consumed_total | Counter | topic, service | Messages consumed from Kafka |
| kafka_processing_duration_ms | Histogram | topic, event_type, service | Event processing duration |
| outbox_pending_count | Gauge | service | Current pending outbox records |
| outbox_publish_failures_total | Counter | service | Outbox publish failures |
| payroll_job_duration_ms | Histogram | status, service | Payroll job processing duration |
| payroll_transaction_failures_total | Counter | reason, service | Transaction failure count |

## 2. CorrelationId Propagation

- HTTP requests: already handled by CorrelationIdMiddleware
- Kafka events: ensure correlationId is set in the EventEnvelope before publishing
- Kafka consumer: read correlationId from envelope and set in ASYNC_LOCAL_STORAGE

## 3. Metrics Endpoint

- `GET /api/metrics` on every service
- Returns Prometheus-formatted metrics

## Acceptance Criteria

1. Every service exposes `/api/metrics` with Prometheus metrics
2. HTTP request count and duration are tracked
3. Kafka message count and processing duration are tracked
4. Outbox pending count is observable
5. CorrelationId flows through Kafka events
6. All existing tests still pass
