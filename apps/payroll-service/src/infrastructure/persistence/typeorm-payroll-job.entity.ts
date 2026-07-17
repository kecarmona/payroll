import { Entity, Column, PrimaryColumn, Unique } from 'typeorm';

/**
 * TypeORM entity mapping the PayrollJob aggregate to the `payroll_jobs` table.
 *
 * The unique constraint on (companyId, periodId) ensures only one job
 * per company per payroll period.
 */
@Entity('payroll_jobs')
@Unique(['companyId', 'periodId'])
export class TypeOrmPayrollJobEntity {
  /** Primary key — the PayrollJobId value (UUID v4). */
  @PrimaryColumn('uuid')
  id!: string;

  /** Tenant (company) this job belongs to. */
  @Column('varchar')
  companyId!: string;

  /** The payroll period this job targets. */
  @Column('varchar')
  periodId!: string;

  /** Current status: CREATED, PROCESSING, COMPLETED, or FAILED. */
  @Column({ type: 'varchar', default: 'CREATED' })
  status!: string;

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
