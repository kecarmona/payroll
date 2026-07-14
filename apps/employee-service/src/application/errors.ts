import { DomainError } from '@payroll/shared-kernel';

/**
 * Error raised when an employee is not found by the given identifier.
 *
 * Carries the searched `employeeId` for structured error handling.
 */
export class EmployeeNotFoundError extends DomainError {
  /** The employee identifier that was searched for. */
  readonly employeeId: string;

  constructor(employeeId: string) {
    super('employee-service', `Employee with id "${employeeId}" not found`);
    this.employeeId = employeeId;
  }
}

/**
 * Error raised when attempting to create an employee with an existing email.
 *
 * Carries the duplicate `email` for structured error handling.
 */
export class EmployeeAlreadyExistsError extends DomainError {
  /** The email address that already exists. */
  readonly email: string;

  constructor(email: string) {
    super('employee-service', `An employee with email "${email}" already exists`);
    this.email = email;
  }
}
