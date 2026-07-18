import { DomainError } from '@payroll/shared-kernel';

/**
 * Error raised when an invalid payroll job status transition is attempted.
 *
 * Only valid transitions:
 * - CREATED → PROCESSING
 * - PROCESSING → COMPLETED | FAILED
 */
export class InvalidStatusTransitionError extends DomainError {
  /** The current status value. */
  readonly fromStatus: string;
  /** The attempted target status value. */
  readonly toStatus: string;

  constructor(fromStatus: string, toStatus: string) {
    super(
      'payroll',
      `Invalid status transition from "${fromStatus}" to "${toStatus}"`,
    );
    this.fromStatus = fromStatus;
    this.toStatus = toStatus;
  }
}
