# Feature Specification: Process Payroll Job

Status

Draft

---

# Purpose

Process all eligible employees for a payroll job using asynchronous payroll transactions.

---

# Trigger

PayrollJobCreated event.

---

# Preconditions

- Payroll job exists.
- Payroll job belongs to a company.
- Employees are available from the Employee context or a valid snapshot.
- Event has not already been processed by the consumer.

---

# Flow

1. Payroll Processing Service consumes PayrollJobCreated.
2. Service marks event as processed or detects duplicate.
3. Service creates payroll transactions for eligible employees.
4. Each transaction is processed independently.
5. Successful transactions produce payslips.
6. Failed transactions are retried when recoverable.
7. Payroll job is completed when all transactions reach a terminal state.

---

# Business Rules

- One payroll transaction is created per eligible employee.
- A failed employee transaction must not fail other employee transactions.
- Duplicate events must not create duplicate transactions.
- Transaction state changes use optimistic locking.
- Payslips are immutable once generated.

---

# Acceptance Criteria

- PayrollJobCreated creates transactions for eligible employees.
- Duplicate PayrollJobCreated event is a no-op.
- Completed transactions generate payslips.
- Failed transactions are retried according to retry policy.
- Retry exhaustion emits PayrollTransactionFailed.
- Payroll job completes when all transactions are terminal.

---

# Test Requirements

- Unit tests for transaction state machine.
- Integration tests for idempotent event consumption.
- Integration tests for optimistic locking conflicts.
- E2E test for successful payroll job.
- Failure test for duplicate Kafka message.

