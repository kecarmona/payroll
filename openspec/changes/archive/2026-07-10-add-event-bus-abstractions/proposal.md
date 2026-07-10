# Proposal: Add Event Bus Abstractions

## Intent

The event-bus lib has publisher/handler ports but no serialization or routing layer. Services currently have no standard way to serialize `EventEnvelope` to wire format, validate incoming data, or resolve Kafka topics from event types. This gap makes every service reinvent these concerns, leading to brittle integration.

## Scope

### In Scope
- `EventSerializer` port — serialize `EventEnvelope<T>` to `Buffer`
- `EventDeserializer` port — parse `Buffer` back to `EventEnvelope<T>` with shape validation
- `TopicRegistry` — typed map from domain → topic name
- Unit tests proving ports are correctly typed and usable

### Out of Scope
- JSON serializer implementation (concrete adapter deferred)
- Avro/Protobuf adapters (ports leave room for these)
- Kafka producer/consumer integration (NestJS adapters deferred)
- Topic resolver auto-discovery or convention-based routing

## Capabilities

### New Capabilities
- `event-serialization`: Port interfaces for encoding/decoding `EventEnvelope` to/from `Buffer`. Format-agnostic — leaves concrete encoding to adapters.
- `event-routing`: Topic registry types and resolution abstraction for mapping event types to Kafka topics.

### Modified Capabilities
None.

## Approach

Add three pure-port modules to `libs/event-bus/src/lib/`:
1. `event-serializer.ts` — `EventSerializer` interface with `serialize<T>(event: EventEnvelope<T>): Buffer` and optional `contentType` descriptor
2. `event-deserializer.ts` — `EventDeserializer` interface with `deserialize<T>(data: Buffer): EventEnvelope<T>`, throws on missing required fields
3. `topic-registry.ts` — `TopicRegistry` record type keyed by domain string, plus a resolver function type

All modules import only from `@payroll/contracts`. Zero NestJS or Kafka deps.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `libs/event-bus/src/lib/` | New | 3 port files + index re-export |
| `libs/event-bus/src/lib/event-serializer.spec.ts` | New | Unit tests for serializer/deserializer types |
| `libs/event-bus/src/lib/topic-registry.spec.ts` | New | Unit tests for topic registry types |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Port interface too narrow for future encodings | Low | `serialize` returns `Buffer`, not `string` — flexible enough |
| Over-engineering before concrete adapters exist | Medium | Keep to 3 files, zero generics beyond `TPayload` |

## Rollback Plan

Revert the 3 new files and index update. No downstream code exists yet — zero blast radius.

## Dependencies

- `@payroll/contracts` (existing — provides `EventEnvelope`)

## Success Criteria

- [ ] All ports compile with strict TypeScript
- [ ] Unit tests pass for serializer/deserializer type correctness
- [ ] Unit tests pass for topic registry type correctness
- [ ] Zero NestJS or Kafka imports in port files
