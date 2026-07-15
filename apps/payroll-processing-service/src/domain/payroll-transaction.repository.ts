import { PayrollTransaction } from './payroll-transaction.entity';

/**
 * Port interface for PayrollTransaction repository operations.
 *
 * Defines the contract for persisting and retrieving PayrollTransaction
 * aggregates. The implementation lives in the infrastructure layer (TypeORM).
 */
export interface PayrollTransactionRepository {
  /**
   * Persists a PayrollTransaction aggregate.
   *
   * Creates a new record or updates an existing one. The implementation
   * MUST check the version field for optimistic concurrency control.
   *
   * @param transaction - The PayrollTransaction aggregate to save.
   */
  save(transaction: PayrollTransaction): Promise<void>;

  /**
   * Finds a PayrollTransaction by its unique identifier.
   *
   * @param id - The transaction ID string.
   * @returns The PayrollTransaction aggregate, or `null` if not found.
   */
  findById(id: string): Promise<PayrollTransaction | null>;

  /**
   * Finds all transactions for a given payroll job.
   *
   * @param jobId - The payroll job identifier.
   * @returns An array of PayrollTransaction aggregates.
   */
  findByJobId(jobId: string): Promise<PayrollTransaction[]>;
}
