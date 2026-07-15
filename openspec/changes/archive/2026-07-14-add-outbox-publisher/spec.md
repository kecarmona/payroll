# Spec: Add Outbox Publisher

## 1. Shared Outbox Library (`libs/transactional-outbox/`)

### 1.1 Domain Port

```typescript
interface OutboxStore {
  save(event: { id: string; eventType: string; aggregateId: string; payload: unknown }): Promise<void>;
}
```

### 1.2 Publisher Port

```typescript
interface OutboxPublisher {
  /** Polls the outbox table and publishes pending events to Kafka. */
  publishPending(): Promise<void>;
}
```

### 1.3 TypeORM Entity — `outbox` table

| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| event_type | varchar | NOT NULL |
| aggregate_id | varchar | NOT NULL |
| payload | jsonb | NOT NULL |
| created_at | timestamptz | NOT NULL, default NOW() |
| published_at | timestamptz | NULL = pending |
| retry_count | int | NOT NULL, default 0 |
| last_error | text | NULL |

### 1.4 NestJS Module

`TransactionalOutboxModule` — provides `OutboxStore` token, exports entity + repository for DataSource registration.

## Acceptance Criteria

1. `OutboxStore.save()` persists a record with `publishedAt = NULL`
2. `OutboxPublisher.publishPending()` polls unpublished records, serializes via `EventSerializer`, publishes to Kafka, marks as published
3. Kafka unavailable → records remain unpublished, error is logged, retry on next poll
4. Publish success/failure is observable via logger
5. Configurable poll interval via env var
6. All existing payroll-service tests still pass (outbox still works in-process)
