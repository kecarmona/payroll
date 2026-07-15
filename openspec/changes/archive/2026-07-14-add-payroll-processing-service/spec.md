# Spec: Add Payroll Processing Service

## 1. Domain

### 1.1 PayrollTransaction Aggregate

State machine: `PENDING → PROCESSING → COMPLETED | FAILED`

| State | Transitions |
|---|---|
| PENDING | → PROCESSING (start processing) |
| PROCESSING | → COMPLETED (success), → FAILED (error, retries exhausted) |
| COMPLETED | terminal |
| FAILED | terminal |

Fields: id, jobId, employeeId, companyId, periodId, status, grossPay, deductions, netPay, version (optimistic locking), createdAt, updatedAt

### 1.2 Payslip Aggregate (immutable)

- Created once per successful transaction
- Fields: id, transactionId, jobId, employeeId, companyId, periodId, grossPay, deductions, netPay, generatedAt
- Immutable — no state changes after creation

### 1.3 Payroll Calculation Domain Service

- Stub for now: grossPay = base salary, deductions = 20% tax, netPay = grossPay - deductions
- Interface allows swapping for real formulas later

## 2. Application

### 2.1 ProcessPayrollJobConsumer

- Consumes `PayrollJobCreated` from Kafka topic `payroll.events`
- Checks processed-event store for idempotency
- Creates `PayrollTransaction` per eligible employee
- Emits `PayrollTransactionCreated` via outbox

### 2.2 ProcessPayrollTransactionCommand

- Processes a single transaction
- Uses optimistic locking (version field)
- On success: generates Payslip, emits `PayrollTransactionCompleted` + `PayslipGenerated`
- On failure: retries up to N times, then emits `PayrollTransactionFailed`

## 3. Events Emitted

- `PayrollTransactionCreated` (v1)
- `PayrollTransactionCompleted` (v1)
- `PayrollTransactionFailed` (v1)
- `PayslipGenerated` (v1)

## Acceptance Criteria

1. PayrollJobCreated → transactions created per employee
2. Duplicate PayrollJobCreated → no-op (idempotent consumer)
3. Each transaction processes independently (one failure doesn't block others)
4. Successful transaction → immutable payslip + PayslipGenerated event
5. Failed transaction → retry → PayrollTransactionFailed on exhaustion
6. Optimistic locking prevents concurrent state corruption
7. All events go through the outbox
