# Proposal: Add Outbox Publisher

## Intent

Extract the transactional outbox to a shared library and implement a background publisher that reads pending outbox records and publishes them to Kafka.

## Scope

1. **Shared outbox library** (`libs/transactional-outbox/`) — domain port, TypeORM entity + repository, NestJS module
2. **Kafka publisher** — background worker that polls the outbox table, serializes events via `EventSerializer`, publishes to Kafka via `kafkajs`, and marks records as published
3. **Retry + observability** — configurable poll interval, retry with backoff, logging/metrics on publish success/failure

## Non-goals

- Consumer implementation (Phase 9)
- Avro/Protobuf serialization (JSON is fine for now)
- Outbox cleanup/purge of old records
- Kafka cluster setup (docker-compose already has Kafka + Kafka UI)

## Dependencies

- `libs/event-bus` — EventSerializer, TopicRegistry
- `libs/contracts` — EventEnvelope
- `libs/shared-kernel` — DomainEvent base
- Docker Compose (Kafka already running on 9092)
