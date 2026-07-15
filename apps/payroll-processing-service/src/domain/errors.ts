import { DomainError } from '@payroll/shared-kernel';

/**
 * Error raised when an invalid payroll transaction status transition is attempted.
 */
export class InvalidTransactionStatusTransitionError extends DomainError {
  /** The current status value. */
  readonly fromStatus: string;
  /** The attempted target status value. */
  readonly toStatus: string;

  constructor(fromStatus: string, toStatus: string) {
    super(
      'payroll-processing',
      `Invalid transaction status transition from "${fromStatus}" to "${toStatus}"`,
    );
    this.fromStatus = fromStatus;
    this.toStatus = toStatus;
  }
}

/**
 * Error raised when a payroll transaction is not found by its identifier.
 */
export class PayrollTransactionNotFoundError extends DomainError {
  /** The identifier that was searched for. */
  readonly transactionId: string;

  constructor(transactionId: string) {
    super('payroll-processing', `Payroll transaction with id "${transactionId}" not found`);
    this.transactionId = transactionId;
  }
}

/**
 * Error raised when a processed event is replayed (idempotency violation).
 */
export class EventAlreadyProcessedError extends DomainError {
  /** The event ID that was already processed. */
  readonly eventId: string;

  constructor(eventId: string) {
    super('payroll-processing', `Event "${eventId}" has already been processed`);
    this.eventId = eventId;
  }
}
