# ADR 0003: Use PostgreSQL, MongoDB and Redis

Status

Accepted

---

# Context

The platform separates command-side consistency from query-side read performance.

It also needs fast idempotency and short-lived operational state.

---

# Decision

Use:

- PostgreSQL for command-side service data.
- MongoDB for read-side projections.
- Redis for idempotency, rate limiting and ephemeral state.

---

# Consequences

Positive:

- PostgreSQL provides strong transactional guarantees.
- MongoDB supports denormalized query models.
- Redis provides low-latency key-value operations.

Tradeoffs:

- More infrastructure to operate.
- Requires explicit data synchronization through events.
- Read models are eventually consistent.

---

# Rules

- PostgreSQL remains the source of truth for command-side aggregates.
- MongoDB projections are rebuildable.
- Redis must not become the system of record.

