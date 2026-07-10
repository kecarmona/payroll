# ADR 0005: Use CQRS Projections

Status

Accepted

---

# Context

Payroll dashboards and reports need fast reads across data produced by multiple services.

Joining service-owned databases would violate data ownership.

---

# Decision

Use CQRS with MongoDB read-side projections.

Command services publish events.

The Payroll Projection Service consumes events and builds read models.

---

# Consequences

Positive:

- Read models can be optimized for UI and reporting.
- Service databases remain private.
- Projections can be rebuilt from events.

Tradeoffs:

- Reads are eventually consistent.
- Projection lag must be observable.
- Projection handlers must be idempotent.

---

# Rules

- UI queries should prefer read models.
- Read models must store source event metadata.
- Projection rebuild strategy must be documented before production use.

