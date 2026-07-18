# Design for Add Event Bus Abstractions

## Overview

Three pure TypeScript port interfaces extending the event-bus library's abstraction layer. All ports depend only on `@payroll/contracts` (`EventEnvelope`). No NestJS, Kafka, or infrastructure dependencies — designed for testability and future adapter implementation.

## File Plan

```
libs/event-bus/src/lib/
├── event-publisher.ts        (unchanged)
├── event-handler.ts          (unchanged)
├── event-serializer.ts       [NEW] — EventSerializer port
├── event-deserializer.ts     [NEW] — EventDeserializer port
├── topic-registry.ts         [NEW] — TopicRegistry port
├── event-serializer.spec.ts       [NEW] — port structural tests
├── event-deserializer.spec.ts     [NEW] — port structural tests
├── topic-registry.spec.ts         [NEW] — port structural tests
├── index.ts                  [MODIFY] — add exports for all 3 new ports

libs/event-bus/test/              (no test dir changes needed)
```

## Interfaces

### EventSerializer

```ts
import { EventEnvelope } from '@payroll/contracts';

export interface EventSerializer {
  serialize<TPayload>(event: EventEnvelope<TPayload>): Buffer;
}
```

- **Type param**: `TPayload` — inferred from the envelope; no explicit constraint
- **Return**: `Buffer` — wire-format agnostic (JSON, Avro, Protobuf all produce `Buffer`)
- **Contract**: MUST NOT throw for valid envelopes; concrete adapters own validation rules

### EventDeserializer

```ts
import { EventEnvelope } from '@payroll/contracts';

export interface EventDeserializer {
  deserialize<TPayload>(data: Buffer): EventEnvelope<TPayload>;
}
```

- **Type param**: `TPayload` — caller-specified expected payload shape
- **Return**: Typed `EventEnvelope<TPayload>`
- **Contract**: MAY throw on malformed input; callers MUST handle errors

### TopicRegistry

```ts
export type TopicName = string;

export interface TopicRegistry {
  resolve(eventType: string): TopicName;
}
```

- **Type alias**: `TopicName` — string wrapper for readability and future migration
- **Input**: Domain event type string (e.g. `"PayrollJobCreated"`)
- **Contract**: MAY throw for unregistered types; concrete impls own lookup strategy

## Index Changes

`libs/event-bus/src/index.ts` — add three export lines:

```ts
export * from './lib/event-handler';
export * from './lib/event-publisher';
export * from './lib/event-serializer';    // NEW
export * from './lib/event-deserializer';  // NEW
export * from './lib/topic-registry';      // NEW
```

## Test Strategy

| Test file | Approach |
|---|---|
| `event-serializer.spec.ts` | Define a mock serializer implementing `EventSerializer`; assert return type is `Buffer` |
| `event-deserializer.spec.ts` | Define a mock deserializer implementing `EventDeserializer`; assert return type is `EventEnvelope` |
| `topic-registry.spec.ts` | Define a mock registry implementing `TopicRegistry`; assert type correctness of `TopicName` and `resolve` return |

Tests verify port structure and type contracts only — concrete adapter behavior is out of scope.

## Architecture Decision

**Decision**: Keep serialization, deserialization, and routing as separate interfaces rather than a single `EventTransport` monolith.

**Rationale**: Single-responsibility principle — each port changes for a different reason (encoding format vs. routing topology). Separating them allows independent adapter selection (e.g. JSON serializer + in-memory registry for development; Avro + ZooKeeper-based registry for production).

## Dependencies

- `@payroll/contracts` — provides `EventEnvelope` type (existing)

## Risk Mitigation

- **Over-engineering**: Kept to 3 files, single generic parameter `TPayload`, zero inheritance
- **Narrow contract**: `Buffer` return type covers all modern wire formats; if streaming is needed later, a separate `EventStreamSerializer` can be added without breaking existing adapters
- **Rollback**: Revert the 3 new files and the index modification. No downstream consumers exist yet.
