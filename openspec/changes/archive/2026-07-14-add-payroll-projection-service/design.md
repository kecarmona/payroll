# Design: Add Payroll Projection Service

## Architecture

```
Kafka (payroll.events)
    │
    ▼
┌─────────────────────────────────────┐
│  PayrollProjectionService            │
│  (event consumer + REST API)         │
│                                      │
│  ┌─────────────────────────────┐     │
│  │  Kafka Consumer              │     │
│  │  - Deserialize events       │     │
│  │  - Route by eventType       │     │
│  └──────────┬──────────────────┘     │
│             ▼                        │
│  ┌─────────────────────────────┐     │
│  │  Projection Handlers         │     │
│  │  - handlePayrollJobCreated   │     │
│  │  - handleTransactionCompleted│     │
│  │  - handleTransactionFailed   │     │
│  │  - handlePayslipGenerated    │     │
│  └──────────┬──────────────────┘     │
│             ▼                        │
│  ┌─────────────────────────────┐     │
│  │  MongoDB (Mongoose)          │     │
│  │  - PayrollJob model          │     │
│  │  - Transaction model         │     │
│  │  - Payslip model             │     │
│  └─────────────────────────────┘     │
│             │                        │
│  ┌─────────────────────────────┐     │
│  │  REST Controllers            │     │
│  │  - Jobs, Transactions,       │     │
│  │    Payslips queries          │     │
│  └─────────────────────────────┘     │
└─────────────────────────────────────┘
