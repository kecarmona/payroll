import { Entity, Column, PrimaryColumn } from 'typeorm';

/**
 * TypeORM entity mapping the Payslip to the `payslips` table.
 *
 * Payslips are immutable — once generated they are never updated.
 * Financial amounts are stored as integer cents.
 */
@Entity('payslips')
export class TypeOrmPayslipEntity {
  /** Primary key — the payslip ID (UUID v4). */
  @PrimaryColumn('uuid')
  id!: string;

  /** The transaction this payslip is for. */
  @Column('varchar')
  transactionId!: string;

  /** The parent payroll job identifier. */
  @Column('varchar')
  jobId!: string;

  /** The employee this payslip is for. */
  @Column('varchar')
  employeeId!: string;

  /** The tenant (company) this payslip belongs to. */
  @Column('varchar')
  companyId!: string;

  /** The payroll period identifier. */
  @Column('varchar')
  periodId!: string;

  /** Gross pay in cents. */
  @Column({ name: 'grossPayCents', type: 'integer' })
  grossPayCents!: number;

  /** Total deductions in cents. */
  @Column({ name: 'deductionsCents', type: 'integer' })
  deductionsCents!: number;

  /** Net pay in cents (gross - deductions). */
  @Column({ name: 'netPayCents', type: 'integer' })
  netPayCents!: number;

  /** ISO 4217 currency code. */
  @Column('varchar')
  currency!: string;

  /** Timestamp when the payslip was generated. */
  @Column({ type: 'timestamptz' })
  generatedAt!: Date;
}
