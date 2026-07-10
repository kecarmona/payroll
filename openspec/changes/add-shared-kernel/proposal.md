# Proposal: Add Shared Kernel

## Intent

Build framework-independent domain primitives that every bounded context depends on. Without these, services cannot share a consistent domain language, enforce invariants, or record domain events.

## Scope

### In Scope
- `AggregateRoot` base class extending `Entity` with domain event recording (record → getEvents → clear)
- Generic `Id<T>` value object for type-safe entity IDs
- `CompanyId` strongly-typed tenant ID
- `Money` value object (integer cents, ISO 4217, non-negative invariant)
- Domain error hierarchy: `DomainError` → `ValidationError`, `NotFoundError`
- Optimistic locking pattern via existing `Entity.version` field
- Unit tests for equality, event recording, and Money invariants

### Out of Scope
- In-memory event publisher or bus integration
- Serialization/deserialization for Money or IDs
- Audit trail or event sourcing infrastructure
- Any NestJS module, guard, or decorator

## Capabilities

### New Capabilities
- `shared-kernel`: Domain primitives used across all bounded contexts — Entity, ValueObject, DomainEvent, AggregateRoot, Id, CompanyId, Money, DomainError hierarchy, optimistic locking

### Modified Capabilities
- None

## Approach

Extend existing `libs/shared-kernel/src/lib/` with pure TypeScript classes:

1. **AggregateRoot** — extends `Entity`, adds private `DomainEvent[]` list, `recordEvent()`, `pullEvents()`, `clearEvents()`
2. **Id\<T\>** — wraps a string value, extends `ValueObject`, enforces non-empty invariant
3. **CompanyId** — extends `Id<'CompanyId'>` with branded type
4. **Money** — `ValueObject` with `amount` (integer cents), `currency` (ISO 4217), factory with validation
5. **DomainError** — abstract `Error` subclass; `ValidationError` and `NotFoundError` extend it
6. **Optimistic locking** — `Entity.version` getter, require version match on update, concurrency guard

All zero-dependency, no NestJS.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `libs/shared-kernel/src/lib/` | Modified | Add 4-6 new files, update index.ts |
| `libs/shared-kernel/src/index.ts` | Modified | Re-export new exports |
| `docs/02-architecture/domain-glossary.md` | New | Add AggregateRoot definition if missing |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Overengineering IDs or Money | Low | Start minimal; extend later |
| Breaking existing Entity/ValueObject signature | Low | Backward-compatible extensions only |

## Rollback Plan

Revert the last commit. No database or service impact — pure library change.

## Dependencies

- Existing `Entity`, `ValueObject`, `DomainEvent` in shared-kernel

## Success Criteria

- [ ] All domain primitives compile with zero NestJS imports
- [ ] AggregateRoot records and returns domain events
- [ ] Money rejects negative amounts at construction
- [ ] All classes unit-testable without mocks
- [ ] `nx test shared-kernel` passes
