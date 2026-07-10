# Feature Specification: Generate Payslip

Status

Draft

---

# Purpose

Create an immutable payslip after an employee payroll transaction completes successfully.

---

# Trigger

Successful payroll calculation inside Payroll Processing Service.

---

# Preconditions

- Payroll transaction is in PROCESSING state.
- Calculation completed successfully.
- Payslip does not already exist for the transaction.

---

# Business Rules

- Payslip is immutable.
- Payslip belongs to a company, payroll job and employee.
- Payslip stores calculated earnings, deductions and net pay.
- Payslip generation emits PayslipGenerated through the outbox.
- Duplicate generation attempts return existing payslip or no-op safely.

---

# Acceptance Criteria

- Successful transaction creates exactly one payslip.
- Duplicate processing does not create duplicate payslips.
- Generated payslip emits PayslipGenerated.
- PayslipGenerated can update projections and trigger notifications.

---

# Test Requirements

- Unit tests for payslip creation rules.
- Integration tests for uniqueness constraints.
- Integration tests for outbox event creation.
- E2E test from payroll job to payslip projection.

