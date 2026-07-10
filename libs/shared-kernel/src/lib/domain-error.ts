/**
 * Base class for all domain-level errors.
 *
 * Extends the native `Error` with a `domain` property that identifies which
 * bounded context the error originated from. This enables error routing and
 * structured logging across service boundaries.
 *
 * Domain errors represent business rule violations and expected failure modes,
 * NOT infrastructure or programming errors. They are part of the domain
 * language and should be handled explicitly in application layers.
 */
export abstract class DomainError extends Error {
  /** The bounded context that raised this error (e.g. "shared-kernel", "payroll"). */
  readonly domain: string;

  constructor(domain: string, message: string) {
    super(message);
    this.domain = domain;
    this.name = this.constructor.name;
    // Ensures instanceof checks work correctly when transpiled to ES5
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Error raised when a domain validation rule is violated.
 *
 * Carries the specific `field` that failed validation and a human-readable
 * `message` explaining the violation.
 *
 * @example
 * ```ts
 * throw new ValidationError('email', 'Invalid email format');
 * ```
 */
export class ValidationError extends DomainError {
  /** The field or property that failed validation. */
  readonly field: string;

  constructor(field: string, message: string) {
    super('shared-kernel', message);
    this.field = field;
  }
}

/**
 * Error raised when a requested domain entity could not be found.
 *
 * Carries the `entityType` and the `id` that was searched for, enabling
 * structured error responses and logging.
 *
 * @example
 * ```ts
 * throw new NotFoundError('Employee', 'emp-123');
 * // Message: 'Employee with id "emp-123" not found'
 * ```
 */
export class NotFoundError extends DomainError {
  /** The type of entity that was searched for (e.g. "Employee", "Company"). */
  readonly entityType: string;
  /** The identifier value that was not found. */
  readonly id: string;

  constructor(entityType: string, id: string) {
    super('shared-kernel', `${entityType} with id "${id}" not found`);
    this.entityType = entityType;
    this.id = id;
  }
}
