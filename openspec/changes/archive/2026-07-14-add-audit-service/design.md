# Design: Add Audit Service

## Architecture

```
Kafka (audit.events)
    │
    ▼
┌──────────────────────────────┐
│  Audit Service                │
│  (event consumer, no REST)    │
│                               │
│  ┌───────────────────────┐   │
│  │ Kafka Consumer         │   │
│  │ - Subscribe audit.events│   │
│  │ - Route by eventType   │   │
│  └──────────┬────────────┘   │
│             ▼                │
│  ┌───────────────────────┐   │
│  │ RedactionService       │   │
│  │ - Strip sensitive keys │   │
│  └──────────┬────────────┘   │
│             ▼                │
│  ┌───────────────────────┐   │
│  │ AuditRecordRepository  │   │
│  │ - Append-only insert   │   │
│  │ - Idempotent by eventId│   │
│  └───────────────────────┘   │
└─────────────────────────────┘
