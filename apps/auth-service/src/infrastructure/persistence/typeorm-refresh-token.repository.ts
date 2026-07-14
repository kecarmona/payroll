import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { RefreshToken } from '../../domain/refresh-token.entity';
import type { RefreshTokenRepository } from '../../domain/refresh-token.repository';
import { TypeOrmRefreshTokenEntity } from './typeorm-refresh-token.entity';

/**
 * TypeORM-backed implementation of the {@link RefreshTokenRepository} port.
 *
 * Converts between the domain {@link RefreshToken} entity and the
 * {@link TypeOrmRefreshTokenEntity} persistence model. Uses the TypeORM
 * {@link Repository} pattern via {@link DataSource}.
 *
 * Token lookup is performed by the SHA-256 hash value (not the raw token),
 * preventing timing attacks on the raw token value.
 */
@Injectable()
export class TypeOrmRefreshTokenRepository implements RefreshTokenRepository {
  private readonly repository: Repository<TypeOrmRefreshTokenEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = dataSource.getRepository(TypeOrmRefreshTokenEntity);
  }

  /**
   * Persists a RefreshToken entity.
   *
   * Creates a new record if the token does not exist, or updates an
   * existing record (e.g., when revoking). TypeORM's
   * {@link Repository.save} uses the primary key to determine insert
   * vs. update and checks the {@link VersionColumn} for optimistic
   * concurrency control.
   *
   * @param token - The RefreshToken to save.
   */
  async save(token: RefreshToken): Promise<void> {
    const entity = this.toEntity(token);
    await this.repository.save(entity);
  }

  /**
   * Finds a refresh token by its hashed value.
   *
   * @param tokenHash - The SHA-256 hash of the raw token value.
   * @returns The RefreshToken entity, or `null` if not found.
   */
  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    const entity = await this.repository.findOne({
      where: { tokenHash },
    });

    return entity ? this.toDomain(entity) : null;
  }

  /**
   * Revokes all active (non-revoked) refresh tokens for a given user.
   *
   * Used when token theft is detected — if a revoked token is reused,
   * all of that user's sessions should be invalidated.
   *
   * @param userId - The user whose tokens should all be revoked.
   */
  async revokeAllForUser(userId: string): Promise<void> {
    await this.repository.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );
  }

  /**
   * Converts a domain RefreshToken to a TypeORM entity for persistence.
   *
   * @param token - The domain RefreshToken entity.
   * @returns A TypeORM entity ready for persistence.
   */
  private toEntity(token: RefreshToken): TypeOrmRefreshTokenEntity {
    const entity = new TypeOrmRefreshTokenEntity();
    entity.id = token.id;
    entity.userId = token.userId;
    entity.tokenHash = token.tokenHash;
    entity.expiresAt = token.expiresAt;
    entity.companyId = token.companyId;
    entity.isRevoked = token.isRevoked;
    entity.version = token.version;
    return entity;
  }

  /**
   * Converts a TypeORM entity back to a domain RefreshToken entity.
   *
   * Uses the domain's static `reconstitute` factory to bypass the
   * creation flow.
   *
   * @param entity - The TypeORM entity from the database.
   * @returns A reconstituted domain RefreshToken entity.
   */
  private toDomain(entity: TypeOrmRefreshTokenEntity): RefreshToken {
    return RefreshToken.reconstitute({
      id: entity.id,
      userId: entity.userId,
      tokenHash: entity.tokenHash,
      expiresAt: entity.expiresAt,
      companyId: entity.companyId,
      isRevoked: entity.isRevoked,
      version: entity.version,
    });
  }
}
