# Proposal: Add Observability

## Intent

Make distributed execution traceable and diagnosable across all services.

## Scope

1. **Shared metrics library** (`libs/observability/`) — Prometheus metrics, HTTP duration tracking, Kafka consumer metrics, outbox metrics
2. **Metrics endpoint** — `/api/metrics` with Prometheus metrics on all services
3. **CorrelationId propagation through Kafka** — attach correlationId to event envelopes
4. **Business metrics** — payroll job duration, transaction failures, DLQ count
5. **Dashboard documentation** — recommended metrics queries

## Non-goals

- Full distributed tracing (OpenTelemetry)
- Real-time alerting setup
- Log aggregation pipeline (ELK/Loki)

## Dependencies

- `prom-client` — Prometheus metrics client
- `libs/service-foundation` — CorrelationIdMiddleware, LoggerService
- All service apps
