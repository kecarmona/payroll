# ADR 0006: Use Idempotency for Critical Commands

Status

Accepted

---

# Context

Payroll commands may be retried by clients, gateways or operators.

Duplicate processing could create duplicate jobs, transactions or payments.

---

# Decision

Require Idempotency-Key for critical commands.

The server stores request hash, response and status for replay-safe handling.

---

# Consequences

Positive:

- Safe retries.
- Protection against duplicate payroll execution.
- Clear conflict behavior for key reuse with different payloads.

Tradeoffs:

- Requires idempotency storage and cleanup.
- Requires request hashing consistency.

---

# Rules

- Critical write endpoints reject missing Idempotency-Key.
- Same key and same payload returns original response.
- Same key and different payload returns conflict.

