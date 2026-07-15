# Design: Add Payroll Processing Service

## Architecture

```
Kafka (payroll.events)
    │
    ▼
┌─────────────────────────────────────┐
│  PayrollProcessingService            │
│  (event-driven consumer, no REST)    │
│                                      │
│  ┌─────────────────────────────┐     │
│  │  Interface / Kafka Consumer │     │
│  │  - Consume PayrollJobCreated│     │
│  └──────────┬──────────────────┘     │
│             ▼                        │
│  ┌─────────────────────────────┐     │
│  │  Application Layer          │     │
│  │  - ProcessPayrollJob        │     │
│  │  - ProcessTransaction       │     │
│  └──────────┬──────────────────┘     │
│             ▼                        │
│  ┌─────────────────────────────┐     │
│  │  Domain Layer                │     │
│  │  - PayrollTransaction        │     │
│  │  - Payslip (immutable)       │     │
│  │  - PayrollCalculationService │     │
│  └──────────┬──────────────────┘     │
│             ▼                        │
│  ┌─────────────────────────────┐     │
│  │  Infrastructure              │     │
│  │  - TypeORM entities/repos   │     │
│  │  - Outbox (shared lib)      │     │
│  │  - ProcessedEventStore      │     │
│  └─────────────────────────────┘     │
└─────────────────────────────────────┘
