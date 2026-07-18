# Design: Add Outbox Publisher

## Architecture

```
┌─────────────────────┐     poll (every N ms)     ┌──────────────────┐
│  Payroll Service     │                           │  OutboxPublisher  │
│  (command handler)   │  ─── save() ──►  outbox   │  (background)     │──► Kafka
│  writes to outbox    │      (same TX)    table   │  reads pending    │    topic
└─────────────────────┘                           │  serializes       │
                                                  │  publishes        │
                                                  └──────────────────┘
```

## 2. Kafka Publisher

### 2.1 Implementation

- `KafkaOutboxPublisher` implements `OutboxPublisher`
- Uses `kafkajs` `Producer` to connect to Kafka
- Uses `EventSerializer` to serialize `EventEnvelope` to Buffer
- Uses `TopicRegistry` to resolve event type → topic
- Polls every N ms (configurable via `OUTBOX_POLL_INTERVAL_MS`, default 5000)
- Retry with exponential backoff on publish failure
- Logs success count and failure count per poll cycle

### 2.2 Kafka Configuration

| Env Var | Default | Description |
|---|---|---|
| KAFKA_BROKER | localhost:9092 | Kafka broker address |
| OUTBOX_POLL_INTERVAL_MS | 5000 | Poll interval in ms |
| OUTBOX_BATCH_SIZE | 50 | Max records per poll |

### 2.3 Topic Resolution

Use `TopicRegistry` from `@payroll/event-bus` to map event types to topics.

## 3. Migration

Existing payroll-service outbox table needs `retry_count` and `last_error` columns added.

## 4. Testing

- Unit tests for `KafkaOutboxPublisher` (mocked Kafka producer)
- Unit tests for outbox repository
- Integration test: save → publishPending → verify Kafka message
- Integration test: Kafka unavailable → record stays unpublished
