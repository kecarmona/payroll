import { Entity, PrimaryColumn, Column, VersionColumn } from 'typeorm';

/**
 * TypeORM entity mapping the User aggregate to the `users` table.
 *
 * This entity represents the persistent storage shape of the User aggregate
 * root. The domain layer works with the {@link User} domain entity; this
 * TypeORM entity exists solely for database mapping.
 *
 * The `roles` column uses `simple-json` to store the user's role(s) as a
 * JSON array, enabling future support for multiple roles without schema
 * migration. The current domain model assigns a single role, stored as a
 * single-element array.
 */
@Entity('users')
export class TypeOrmUserEntity {
  /** Primary key — the UserId value (UUID v4). */
  @PrimaryColumn('varchar')
  id!: string;

  /** Unique email address used for authentication. */
  @Column({ unique: true })
  email!: string;

  /** Bcrypt hash of the user's password. */
  @Column()
  passwordHash!: string;

  /**
   * User roles stored as a JSON array.
   * E.g. `["ADMIN"]` or `["HR", "EMPLOYEE"]`.
   */
  @Column('simple-json')
  roles!: string[];

  /** Tenant (company) this user belongs to. */
  @Column()
  companyId!: string;

  /** Whether the user account is active. */
  @Column({ default: true })
  isActive!: boolean;

  /** Optimistic concurrency version — auto-incremented by TypeORM on save. */
  @VersionColumn()
  version!: number;
}
