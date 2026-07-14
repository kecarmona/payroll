import { Entity, Column, PrimaryColumn, Unique } from 'typeorm';

/**
 * TypeORM entity mapping the PayrollPeriod aggregate to the `payroll_periods` table.
 *
 * The unique constraint on (companyId, month, year) ensures only one period
 * per company per month.
 */
@Entity('payroll_periods')
@Unique(['companyId', 'month', 'year'])
export class TypeOrmPayrollPeriodEntity {
  /** Primary key — the PayrollPeriodId value (UUID v4). */
  @PrimaryColumn('uuid')
  id!: string;

  /** Tenant (company) this period belongs to. */
  @Column()
  companyId!: string;

  /** The month (1-12) this payroll period covers. */
  @Column('integer')
  month!: number;

  /** The year this payroll period covers. */
  @Column('integer')
  year!: number;

  /** The start date of the payroll period (ISO string). */
  @Column()
  startDate!: string;

  /** The end date of the payroll period (ISO string). */
  @Column()
  endDate!: string;

  /** Whether the period is closed for modifications. */
  @Column({ default: false })
  isClosed!: boolean;

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
