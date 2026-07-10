# Design: Add Shared Kernel

## Technical Approach

Extend `libs/shared-kernel` with 5 pure-TypeScript, zero-dependency classes that complete the domain primitive set: `AggregateRoot`, `Id<T>`, `CompanyId`, `Money`, and a `DomainError` hierarchy. Each class builds on the existing `Entity`, `ValueObject`, and `DomainEvent` without modifying their signatures. Tests follow strict TDD via Jest.

## Architecture Decisions

| Decision | Option | Tradeoff | Choice |
|----------|--------|----------|--------|
| Entity `<TId>` compatibility with `Id<T>` | (A) Modify Entity to accept non-string TId | Breaks existing consumers, `equals()` needs structural comparison | **B** — keep Entity as-is; pass `id.toString()` in concrete aggregates |
| | (B) Keep `TId extends string`; typed IDs used externally | Slightly more verbose in constructors, zero breakage | ✅ |
| `Id<T>` base class | (A) Class with generic param | Type-safe, branded via phantom type | ✅ **A** — standard TS branded-type pattern |
| | (B) Type alias + brand | No runtime behavior; can't extend | |
| Money factory | (A) Multiple constructors | Ambiguous validation paths | ✅ **B** — single `fromCents` factory ensures invariant enforcement |
| | (B) Single static `fromCents` factory | One clear entry point with validation | |
| Money arithmetic (`add`/`subtract`) | (A) Return `Money` | Chainable, immutable | ✅ **A** — pure functions, no mutation |
| | (B) Mutate in-place | Side effects, violates ValueObject contract | |
| Event clearing on pull | (A) `pullEvents()` returns + clears | Single call pattern (safe) | ✅ **A** — prevents double-processing bug |
| | (B) Separate `getEvents()` + `clearEvents()` | Caller may forget to clear | |

## Data Flow

```
Domain Command
    │
    ▼
AggregateRoot.recordEvent(event)   ← method call
    │
    ▼
[private DomainEvent[]] stored in-memory
    │
    ▼ (after business logic completes)
AggregateRoot.pullEvents()         ← returns array AND clears
    │
    ▼
Service → Outbox → Kafka
```

`Id<T>`, `CompanyId`, `Money`, and `DomainError` are stateless value objects / errors — no data flow, pure construction + behavior.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `libs/shared-kernel/src/lib/aggregate-root.ts` | Create | Extends `Entity`, private event list, `recordEvent()`, `pullEvents()`, `clearEvents()`, `assertVersion()` |
| `libs/shared-kernel/src/lib/id.ts` | Create | Generic `Id<T>` extending `ValueObject<{ value: string }>`, branded type, non-empty validation, `toString()`, static `generate()` |
| `libs/shared-kernel/src/lib/company-id.ts` | Create | Extends `Id<'CompanyId'>`, static `create()` and `from(value)` |
| `libs/shared-kernel/src/lib/money.ts` | Create | ValueObject with `amountCents` + `currency`, `fromCents()` factory, non-negative + ISO 4217 validation, `add()`/`subtract()` |
| `libs/shared-kernel/src/lib/domain-error.ts` | Create | Abstract `DomainError extends Error` with `domain`, concrete `ValidationError` + `NotFoundError` |
| `libs/shared-kernel/src/lib/index.ts` | Create | Barrel file re-exporting all 7 classes |
| `libs/shared-kernel/src/index.ts` | Modify | Add `export * from './lib/index'` |
| `libs/shared-kernel/src/lib/aggregate-root.spec.ts` | Create | Unit tests for event recording, clearing, version assertion |
| `libs/shared-kernel/src/lib/id.spec.ts` | Create | Unit tests for creation, equality, generation, empty guard |
| `libs/shared-kernel/src/lib/company-id.spec.ts` | Create | Unit tests for create, from, type safety |
| `libs/shared-kernel/src/lib/money.spec.ts` | Create | Unit tests for factory, invariants, arithmetic, cross-currency guard |
| `libs/shared-kernel/src/lib/domain-error.spec.ts` | Create | Unit tests for error type checking, message, domain |

## Interfaces / Contracts

```typescript
// aggregate-root.ts
abstract class AggregateRoot<TId extends string> extends Entity<TId> {
  recordEvent(event: DomainEvent): void;
  pullEvents(): DomainEvent[];
  clearEvents(): void;
  assertVersion(expected: number): void;
}

// id.ts
abstract class Id<T> extends ValueObject<{ value: string }> {
  static generate(): Id<T>;      // uses crypto.randomUUID()
  toString(): string;
}

// company-id.ts
class CompanyId extends Id<'CompanyId'> {
  static create(): CompanyId;    // UUID v4
  static from(value: string): CompanyId;
}

// money.ts (interface shape via ValueObject<{ amountCents: number; currency: string }>)
class Money extends ValueObject<{ amountCents: number; currency: string }> {
  static fromCents(amountCents: number, currency?: string): Money;
  get amount(): number;          // readonly, in cents
  get currency(): string;        // readonly, ISO 4217
  add(other: Money): Money;
  subtract(other: Money): Money;
}

// domain-error.ts
abstract class DomainError extends Error {
  readonly domain: string;
}
class ValidationError extends DomainError {
  constructor(field: string, message: string);
}
class NotFoundError extends DomainError {
  constructor(entityType: string, id: string);
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | AggregateRoot: record 0/N events, pull clears list, version mismatch throws | Instantiate test subclass, call methods, assert arrays/errors |
| Unit | Id: generation produces UUID, empty string rejected, equality via ValueObject | `expect(id.toString()).toMatch(UUID_RE)` |
| Unit | CompanyId: create/from produce valid IDs, type distinct from other Ids | `expect(CompanyId.create()).toBeInstanceOf(CompanyId)` |
| Unit | Money: non-negative rejects negative, same-currency add/subtract, cross-currency throws, ISO 4217 validation | Multiple named `it()` cases per invariant |
| Unit | DomainError: instanceof checks, message content, domain property | `expect(() => { throw new ValidationError(...) }).toThrow(ValidationError)` |

No integration, E2E, or NestJS wiring — pure domain logic only.

## Migration / Rollout

No migration required. Library-only change — consumers import new classes when ready.

## Open Questions

None. All design decisions resolved against existing codebase patterns.
