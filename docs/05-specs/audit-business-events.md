# Feature Specification: Audit Business Events

Status

Draft

---

# Purpose

Persist immutable audit records for important business events.

---

# Trigger

Business-critical integration events.

---

# Scope

Audit Service consumes events from core topics and stores audit records.

Initial audited events:

- UserRoleChanged
- EmployeeCreated
- EmployeeSalaryChanged
- EmployeeTerminated
- PayrollJobCreated
- PayrollJobCompleted
- PayrollJobFailed
- PayrollTransactionCompleted
- PayrollTransactionFailed
- PayslipGenerated

---

# Business Rules

- Audit records are append-only.
- Duplicate events do not create duplicate audit records.
- Audit records preserve eventId, companyId, correlationId and payload summary.
- Sensitive payload fields are redacted.

---

# Acceptance Criteria

- Audit Service stores a record for each configured event.
- Duplicate event consumption is idempotent.
- Audit records cannot be modified through public APIs.
- Sensitive fields are not stored in plaintext unless explicitly required.

---

# Test Requirements

- Integration tests for event consumption.
- Integration tests for duplicate event handling.
- Security tests for sensitive field redaction.

