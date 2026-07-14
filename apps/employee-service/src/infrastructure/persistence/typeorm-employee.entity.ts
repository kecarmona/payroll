import { Entity, Column, PrimaryColumn } from 'typeorm';

/**
 * TypeORM entity mapping the Employee aggregate to the `employees` table.
 *
 * This entity represents the persistent storage shape of the Employee
 * aggregate root. The domain layer works with the {@link Employee} domain
 * entity; this TypeORM entity exists solely for database mapping.
 *
 * The `salaryAmount` column stores the salary in cents as an integer,
 * and `salaryCurrency` stores the ISO 4217 three-letter currency code.
 * Optimistic concurrency is managed via the `version` column.
 */
@Entity('employees')
export class TypeOrmEmployeeEntity {
  /** Primary key — the EmployeeId value (UUID v4). */
  @PrimaryColumn('uuid')
  id!: string;

  /** Tenant (company) this employee belongs to. */
  @Column()
  companyId!: string;

  /** Email address — nullable for auto-provisioned users. */
  @Column({ nullable: true })
  email!: string;

  /** Employee's full name. */
  @Column()
  name!: string;

  /** Employee's position/job title. */
  @Column()
  position!: string;

  /** Salary amount in cents (integer). */
  @Column('integer')
  salaryAmount!: number;

  /** ISO 4217 three-letter currency code (e.g. 'USD', 'EUR'). */
  @Column({ length: 3 })
  salaryCurrency!: string;

  /** Department the employee belongs to. */
  @Column()
  department!: string;

  /** Employment status — 'ACTIVE' or 'TERMINATED'. */
  @Column({ default: 'ACTIVE' })
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
