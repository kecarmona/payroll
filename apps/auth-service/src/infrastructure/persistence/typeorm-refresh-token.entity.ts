import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  VersionColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * TypeORM entity mapping the RefreshToken entity to the `refresh_tokens` table.
 *
 * Refresh tokens are stored hashed (SHA-256) to prevent exposure of the raw
 * token value. Each token is single-use: after rotation, the old token is
 * marked as `isRevoked = true` for theft detection.
 *
 * The `companyId` column enables tenant-level garbage collection and querying.
 * Indexes on `tokenHash` and `userId` support the primary lookup patterns.
 */
@Entity('refresh_tokens')
@Index(['tokenHash'], { unique: true })
@Index(['userId', 'isRevoked'])
export class TypeOrmRefreshTokenEntity {
  /** Primary key — auto-generated UUID v4. */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** The user this refresh token belongs to. */
  @Column()
  userId!: string;

  /** SHA-256 hash of the raw refresh token value. */
  @Column({ unique: true })
  tokenHash!: string;

  /** When this token expires. */
  @Column()
  expiresAt!: Date;

  /** The tenant (company) this token belongs to. */
  @Column({ default: '' })
  companyId!: string;

  /** Whether this token has been revoked (used or invalidated). */
  @Column({ default: false })
  isRevoked!: boolean;

  /** Optimistic concurrency version — auto-incremented by TypeORM on save. */
  @VersionColumn()
  version!: number;

  /** Auto-set timestamp of when this record was created. */
  @CreateDateColumn()
  createdAt!: Date;
}
