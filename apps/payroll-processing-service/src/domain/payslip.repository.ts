import { Payslip } from './payslip.entity';

/**
 * Port interface for Payslip repository operations.
 *
 * Payslips are immutable — once generated they are never updated,
 * only persisted and read.
 */
export interface PayslipRepository {
  /**
   * Persists a new payslip.
   *
   * @param payslip - The Payslip to persist.
   */
  save(payslip: Payslip): Promise<void>;

  /**
   * Finds a payslip by its unique identifier.
   *
   * @param id - The payslip ID string.
   * @returns The Payslip, or `null` if not found.
   */
  findById(id: string): Promise<Payslip | null>;

  /**
   * Finds the payslip for a given transaction.
   *
   * @param transactionId - The transaction identifier.
   * @returns The Payslip, or `null` if not found.
   */
  findByTransactionId(transactionId: string): Promise<Payslip | null>;
}
