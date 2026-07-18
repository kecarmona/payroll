# Shared Kernel Specification

## Purpose

Framework-independent domain primitives shared across all bounded contexts.
Zero NestJS dependencies — pure TypeScript with no runtime imports beyond the standard library.

## Requirements

### R1: AggregateRoot Records Domain Events

The AggregateRoot MUST extend `Entity` and maintain a private list of `DomainEvent` instances.
It MUST provide `recordEvent()`, `pullEvents()`, and `clearEvents()`.

- GIVEN an AggregateRoot instance with no recorded events
- WHEN `pullEvents()` is called
- THEN an empty array is returned

- GIVEN an AggregateRoot instance
- WHEN a DomainEvent is recorded via `recordEvent()`
- THEN `pullEvents()` returns an array containing that event

- GIVEN an AggregateRoot with recorded events
- WHEN `pullEvents()` is called
- THEN subsequent calls return an empty array

- GIVEN an AggregateRoot with recorded events
- WHEN `clearEvents()` is called
- THEN `pullEvents()` returns an empty array

### R2: Id\<T\> Enforces Non-Empty String

`Id<T>` MUST be a `ValueObject` wrapping a string with branded typing via the generic parameter `T`.
Empty strings MUST be rejected at construction.

- GIVEN a non-empty string value
- WHEN creating `new Id<'User'>('abc-123')`
- THEN `toString()` returns `'abc-123'`
- AND two Id instances with the same value are equal

- GIVEN an empty string
- WHEN creating an Id instance
- THEN construction MUST throw

### R3: CompanyId Creates Validated Tenant IDs

`CompanyId` MUST extend `Id<'CompanyId'>` with factory methods `create()` and `from()`.

- GIVEN no input
- WHEN `CompanyId.create()` is called
- THEN a UUID v4 string is generated as the ID value

- GIVEN a valid non-empty string
- WHEN `CompanyId.from('tenant-abc')` is called
- THEN a CompanyId instance with that value is returned

- GIVEN an empty string
- WHEN `CompanyId.from('')` is called
- THEN construction MUST throw

### R4: Money Represents Amounts as Integer Cents

`Money` MUST be a `ValueObject` where amount is integer cents (non-negative) and currency is a valid ISO 4217 code (3 uppercase letters).

The primary factory is `Money.fromCents(cents: number, currency: string)`.
No dollar-based factory is provided — avoids floating-point ambiguity.

- GIVEN positive cents with a valid 3-letter uppercase currency code
- WHEN `Money.fromCents(1000, 'USD')` is called
- THEN the amount is 1000 and the currency is `'USD'`

- GIVEN negative cents
- WHEN `Money.fromCents(-1, 'USD')` is called
- THEN construction MUST throw

- GIVEN an invalid currency code (lowercase, 2-letter, or containing non-alpha characters)
- WHEN `Money.fromCents(100, 'usd')` is called
- THEN construction MUST throw

### R5: Money Supports Same-Currency Arithmetic

`Money` MUST support `add()` and `subtract()`.
Both operations MUST require operands to share the same currency.
`subtract()` MUST NOT produce a negative amount.

- GIVEN two `USD` Money instances (500¢ and 300¢)
- WHEN `add()` is called
- THEN the result is 800¢ `USD`

- GIVEN two `USD` Money instances (500¢ and 200¢)
- WHEN `subtract()` is called
- THEN the result is 300¢ `USD`

- GIVEN two Money instances with different currencies
- WHEN `add()` is called
- THEN the operation MUST throw

- GIVEN two `USD` Money instances where subtracting would produce a negative result
- WHEN `subtract()` is called
- THEN the operation MUST throw

### R6: DomainError Hierarchy

`DomainError` MUST be an abstract `Error` subclass with a `readonly domain: string` property.
`ValidationError` MUST extend it with `field: string` and a descriptive `message`.
`NotFoundError` MUST extend it with `entityType: string` and `id: string`.

- GIVEN a `ValidationError` with field `'email'` and message `'Invalid format'`
- THEN `domain` is set, `field` is `'email'`, and `message` is `'Invalid format'`

- GIVEN a `NotFoundError` with entityType `'Employee'` and id `'id-123'`
- THEN `domain` is set, `entityType` is `'Employee'`, and `id` is `'id-123'`

### R7: Optimistic Locking Guards Concurrency

`AggregateRoot` MUST provide `assertVersion(expected: number): void`.
It MUST throw when the expected version does not match the current `version`.

- GIVEN an `AggregateRoot` at version 2
- WHEN `assertVersion(2)` is called
- THEN no error is thrown

- GIVEN an `AggregateRoot` at version 2
- WHEN `assertVersion(1)` is called
- THEN an error MUST be thrown
