# Feature Specification: Create Payroll Job

Status

Draft

---

# Purpose

Allow HR users to create a payroll job for a company and payroll period.

The payroll job starts the distributed payroll workflow.

---

# Actors

- HR
- ADMIN

---

# Preconditions

- User is authenticated.
- User belongs to the target company.
- User has HR or ADMIN role.
- Payroll period exists.
- No payroll job exists for the same company and period.
- Idempotency-Key header is present.

---

# Command

POST /payroll/jobs

Required fields:

- companyId
- payrollPeriodId

Required headers:

- Authorization
- Idempotency-Key

---

# Business Rules

- Only one payroll job may exist per company and payroll period.
- Duplicate requests with the same Idempotency-Key and payload return the original response.
- Duplicate requests with a different payload and same key return conflict.
- Payroll jobs are created in CREATED state.
- Payroll Service emits PayrollJobCreated through the outbox.

---

# Acceptance Criteria

- Valid HR request creates a payroll job.
- Duplicate company and period returns conflict.
- Missing Idempotency-Key returns bad request.
- Unauthorized request returns unauthorized.
- Forbidden role returns forbidden.
- Cross-tenant request is rejected.
- PayrollJobCreated is stored in the outbox in the same transaction.

---

# Test Requirements

- Unit tests for payroll job aggregate rules.
- Integration tests for repository uniqueness.
- Integration tests for idempotency behavior.
- Integration tests for outbox insertion.
- E2E test for job creation workflow.

