import { ValueObject } from '@payroll/shared-kernel';

/**
 * Represents the employment status of an employee.
 *
 * Acts as an enum-like value object with defined transition rules:
 * - `ACTIVE` → can transition to `TERMINATED`
 * - `TERMINATED` → terminal state, cannot transition further
 *
 * @example
 * ```ts
 * const status = EmploymentStatus.ACTIVE;
 * console.log(status.value); // 'ACTIVE'
 * console.log(status.canTransitionTo(EmploymentStatus.TERMINATED)); // true
 * ```
 */
export class EmploymentStatus extends ValueObject<{ value: string }> {
  /** Employee is actively employed. */
  static readonly ACTIVE = new EmploymentStatus('ACTIVE');
  /** Employee's employment has been terminated. */
  static readonly TERMINATED = new EmploymentStatus('TERMINATED');

  private static readonly TRANSITIONS: Record<string, string[]> = {
    ACTIVE: ['TERMINATED'],
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
  canTransitionTo(target: EmploymentStatus): boolean {
    const allowed = EmploymentStatus.TRANSITIONS[this.value];
    return allowed?.includes(target.value) ?? false;
  }
}
