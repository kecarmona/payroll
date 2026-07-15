# Spec: Add Audit Service

## 1. Audit Record

| Field | Type | Description |
|---|---|---|
| id | uuid | PK |
| eventId | string | Source event ID (unique index) |
| eventType | string | e.g. PayrollJobCreated |
| companyId | string | Tenant ID |
| correlationId | string | Correlation chain |
| payloadSummary | jsonb | Redacted payload (sensitive fields removed) |
| occurredAt | timestamptz | When the original event occurred |
| recordedAt | timestamptz | When audit record was created |

## 2. Sensitive Field Redaction

Fields to redact: `ssn`, `taxId`, `bankAccount`, `iban`, `routingNumber`, `password`, `token`, `secret`, `refreshToken`

Redaction replaces value with `[REDACTED]` string.

## Acceptance Criteria

1. Each audited event type creates an audit record
2. Duplicate events → no-op (idempotent)
3. Sensitive fields are redacted before storage
4. Records are append-only (no update/delete endpoints)
