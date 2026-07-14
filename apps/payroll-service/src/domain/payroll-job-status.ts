import { ValueObject } from '@payroll/shared-kernel';

/**
 * Represents the lifecycle status of a payroll job.
 *
 * Acts as an enum-like value object with defined transition rules:
 * - `CREATED` → can transition to `PROCESSING`
 * - `PROCESSING` → can transition to `COMPLETED` or `FAILED`
 * - `COMPLETED` and `FAILED` are terminal states
 *
 * @example
 * ```ts
 * const status = PayrollJobStatus.CREATED;
 * console.log(status.value); // 'CREATED'
 * console.log(status.canTransitionTo(PayrollJobStatus.PROCESSING)); // true
 * ```
 */
export class PayrollJobStatus extends ValueObject<{ value: string }> {
  /** Payroll job has been created and is pending processing. */
  static readonly CREATED = new PayrollJobStatus('CREATED');
  /** Payroll job is currently being processed. */
  static readonly PROCESSING = new PayrollJobStatus('PROCESSING');
  /** Payroll job completed successfully. */
  static readonly COMPLETED = new PayrollJobStatus('COMPLETED');
  /** Payroll job failed with one or more unrecoverable errors. */
  static readonly FAILED = new PayrollJobStatus('FAILED');

  private static readonly TRANSITIONS: Record<string, string[]> = {
    CREATED: ['PROCESSING'],
    PROCESSING: ['COMPLETED', 'FAILED'],
  };

  private constructor(value: string) {
    super({ value });
  }

  /** The status string value. */
  get value(): string {
    return this.props.value;
  }

  /**
   * Checks whether this status can transition to the target status.
   *
   * @param target - The target status to transition to.
   * @returns `true` if the transition is valid.
   */
  canTransitionTo(target: PayrollJobStatus): boolean {
    const allowed = PayrollJobStatus.TRANSITIONS[this.value];
    return allowed?.includes(target.value) ?? false;
  }

  /**
   * Returns the PayrollJobStatus from its string representation.
   *
   * @param value - The status string (e.g. 'CREATED', 'PROCESSING').
   * @returns The matching PayrollJobStatus constant.
   */
  static from(value: string): PayrollJobStatus {
    switch (value) {
      case 'CREATED':
        return PayrollJobStatus.CREATED;
      case 'PROCESSING':
        return PayrollJobStatus.PROCESSING;
      case 'COMPLETED':
        return PayrollJobStatus.COMPLETED;
      case 'FAILED':
        return PayrollJobStatus.FAILED;
      default:
        throw new Error(`Invalid PayrollJobStatus value: "${value}"`);
    }
  }
}
