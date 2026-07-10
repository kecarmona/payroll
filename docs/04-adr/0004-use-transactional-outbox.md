# ADR 0004: Use Transactional Outbox

Status

Accepted

---

# Context

Business operations often need to update state and publish events.

Publishing directly to Kafka after a database commit can lose events if the process crashes between the commit and publish.

---

# Decision

Use the transactional outbox pattern for every service that publishes integration events.

Aggregate changes and outbox records are committed in the same database transaction.

An outbox publisher later publishes pending events to Kafka.

---

# Consequences

Positive:

- Prevents committed state without corresponding events.
- Makes event publishing retryable.
- Improves auditability.

Tradeoffs:

- Adds outbox table and publisher process.
- Requires duplicate-safe consumers.
- Published events may be delayed.

---

# Rules

- Never publish business events directly inside the command handler.
- Outbox events must include event envelope metadata.
- Publisher retries must be observable.

