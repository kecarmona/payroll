# ADR 0002: Use Kafka for Event Backbone

Status

Accepted

---

# Context

Payroll processing requires asynchronous communication, replayability, consumer groups and high-throughput event processing.

---

# Decision

Use Apache Kafka as the event backbone.

All cross-service business facts are published as versioned integration events.

---

# Consequences

Positive:

- Strong fit for high-volume event streams.
- Supports horizontal consumer scaling.
- Enables projection rebuilds and audit consumption.

Tradeoffs:

- Requires schema discipline.
- Requires retry and DLQ strategy.
- Requires operational observability.

---

# Rules

- Producers publish through the transactional outbox.
- Consumers must be idempotent.
- Events use a common envelope.
- Breaking schema changes require a new event version.

