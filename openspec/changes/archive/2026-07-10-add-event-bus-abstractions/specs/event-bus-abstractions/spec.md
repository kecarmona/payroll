# Event Bus Abstractions Specification

## Purpose

Port interfaces for event serialization, deserialization, and topic routing within the event-bus library. These abstractions decouple wire-format encoding and topic resolution from the core publisher/handler ports, enabling format-agnostic event processing with zero NestJS or Kafka dependencies.

## Requirements

### Requirement: Event Serializer

The system MUST provide an `EventSerializer` interface that converts typed `EventEnvelope` instances to `Buffer` for transport.

The `serialize<TPayload>(event: EventEnvelope<TPayload>)` method:
- MUST accept any `EventEnvelope` regardless of payload type
- MUST return a `Buffer`
- MUST NOT throw for well-formed envelopes

#### Scenario: Serialize valid envelope to buffer

- GIVEN a valid `EventEnvelope<TPayload>` with complete metadata
- WHEN `serialize(event)` is called
- THEN it MUST return a non-empty `Buffer`

#### Scenario: Typed payload is preserved through serialization

- GIVEN an `EventEnvelope` with a strongly typed payload
- WHEN `serialize()` processes the envelope
- THEN the output `Buffer` MUST contain both envelope metadata and payload

### Requirement: Event Deserializer

The system MUST provide an `EventDeserializer` interface that converts `Buffer` data back to typed `EventEnvelope` instances.

The `deserialize<TPayload>(data: Buffer)` method:
- MUST accept a `Buffer`
- MUST return a typed `EventEnvelope<TPayload>`
- MAY throw on malformed or incomplete input (implementation-specific)

#### Scenario: Deserialize valid buffer to envelope

- GIVEN a `Buffer` containing a well-formed serialized event
- WHEN `deserialize(buffer)` is called
- THEN it MUST return a valid `EventEnvelope` with correct metadata

#### Scenario: Deserialize rejects malformed input

- GIVEN a `Buffer` with corrupted or incomplete data
- WHEN `deserialize(buffer)` is called
- THEN the implementation MAY throw to signal invalid input

### Requirement: Topic Registry

The system MUST provide a `TopicRegistry` interface that maps event types to Kafka topic names.

The `resolve(eventType: string)` method:
- MUST accept a string event type identifier
- MUST return a `TopicName` (string alias)
- MAY throw for unregistered event types

#### Scenario: Resolve known event type

- GIVEN a registered event type (e.g. `"PayrollJobCreated"`)
- WHEN `resolve(eventType)` is called
- THEN it MUST return the corresponding topic name

#### Scenario: Resolve unknown event type

- GIVEN an event type with no registered mapping
- WHEN `resolve(eventType)` is called
- THEN the implementation MAY throw to signal the unresolved type
