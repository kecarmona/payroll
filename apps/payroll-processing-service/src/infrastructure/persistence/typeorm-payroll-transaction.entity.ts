import { Entity, Column, PrimaryColumn } from 'typeorm';

/**
 * TypeORM entity mapping the PayrollTransaction aggregate to the
 * `payroll_transactions` table.
 *
 * Stores per-employee payroll processing state with financial amounts
 * stored as integer cents to avoid floating-point precision issues.
 */
@Entity('payroll_transactions')
export class TypeOrmPayrollTransactionEntity {
  /** Primary key — the PayrollTransactionId value (UUID v4). */
  @PrimaryColumn('uuid')
  id!: string;

  /** Tenant (company) this transaction belongs to. */
  @Column('varchar')
  companyId!: string;

  /** The parent payroll job identifier. */
  @Column('varchar')
  jobId!: string;

  /** The employee this transaction is for. */
  @Column('varchar')
  employeeId!: string;

  /** The payroll period identifier. */
  @Column('varchar')
  periodId!: string;

  /** Current status: PENDING, PROCESSING, COMPLETED, or FAILED. */
  @Column({ type: 'varchar', default: 'PENDING' })
  status!: string;

  /** Gross pay in cents (nullable until calculation). */
  @Column({ name: 'grossPayCents', type: 'integer', nullable: true })
  grossPayCents: number | null = null;

  /** Total deductions in cents (nullable until calculation). */
  @Column({ name: 'deductionsCents', type: 'integer', nullable: true })
  deductionsCents: number | null = null;

  /** Net pay in cents (nullable until calculation). */
  @Column({ name: 'netPayCents', type: 'integer', nullable: true })
  netPayCents: number | null = null;

  /** ISO 4217 currency code (nullable until calculation). */
  @Column({ type: 'varchar', nullable: true })
  currency: string | null = null;

  /** Optimistic concurrency version — incremented on every save. */
  @Column('integer', { default: 0 })
  version!: number;

  /** Record creation timestamp. */
  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  createdAt!: Date;

  /** Last update timestamp. */
  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  updatedAt!: Date;
}
