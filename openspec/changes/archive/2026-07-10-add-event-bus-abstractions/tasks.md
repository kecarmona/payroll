# Tasks: Add Event Bus Abstractions

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~80-120 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Phase 1: Event Serializer (TDD — test first)

- [x] 1.1 RED: Create `event-serializer.spec.ts` — mock impl asserting `serialize()` returns `Buffer`
- [x] 1.2 GREEN: Create `event-serializer.ts` — `EventSerializer` interface with `serialize<TPayload>(event: EventEnvelope<TPayload>): Buffer`
- [x] 1.3 RED: Create `event-deserializer.spec.ts` — mock impl asserting `deserialize()` returns `EventEnvelope<TPayload>`
- [x] 1.4 GREEN: Create `event-deserializer.ts` — `EventDeserializer` interface with `deserialize<TPayload>(data: Buffer): EventEnvelope<TPayload>`

## Phase 2: Topic Registry & Wiring

- [x] 2.1 RED: Create `topic-registry.spec.ts` — mock registry asserting `resolve()` returns `TopicName`
- [x] 2.2 GREEN: Create `topic-registry.ts` — `TopicName` type alias + `TopicRegistry` interface with `resolve(eventType: string): TopicName`
- [x] 2.3 Update `libs/event-bus/src/index.ts` — export `event-serializer`, `event-deserializer`, `topic-registry`

## Phase 3: Verify

- [x] 3.1 `nx test event-bus` — all 3 spec files pass
- [x] 3.2 `nx build event-bus` — compiles clean with strict TypeScript
- [x] 3.3 `nx lint event-bus` — no lint errors

## Phase 4: Roadmap

- [x] 4.1 Update `docs/09-tracking/implementation-roadmap.md` — mark serialization/deserialization contracts done
