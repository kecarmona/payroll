/**
 * Lifecycle status for a single payroll transaction (per-employee).
 *
 * The valid state transitions are:
 * - `PENDING` → `PROCESSING`
 * - `PROCESSING` → `COMPLETED` | `FAILED`
 * - `COMPLETED` / `FAILED` → terminal states (no further transitions)
 */
export enum PayrollTransactionStatus {
  /** Transaction created and awaiting processing. */
  PENDING = 'PENDING',
  /** Transaction is currently being calculated. */
  PROCESSING = 'PROCESSING',
  /** Transaction completed successfully with calculated amounts. */
  COMPLETED = 'COMPLETED',
  /** Transaction failed and will not be retried. */
  FAILED = 'FAILED',
}

/**
 * Checks whether a state transition is valid.
 *
 * @param from - The current status.
 * @param to   - The target status.
 * @returns `true` if the transition is allowed.
 */
export function canTransition(
  from: PayrollTransactionStatus,
  to: PayrollTransactionStatus,
): boolean {
  const transitions: Record<PayrollTransactionStatus, PayrollTransactionStatus[]> = {
    [PayrollTransactionStatus.PENDING]: [PayrollTransactionStatus.PROCESSING],
    [PayrollTransactionStatus.PROCESSING]: [PayrollTransactionStatus.COMPLETED, PayrollTransactionStatus.FAILED],
    [PayrollTransactionStatus.COMPLETED]: [],
    [PayrollTransactionStatus.FAILED]: [],
  };
  return transitions[from]?.includes(to) ?? false;
}
