import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { User } from '../../domain/user.entity';
import { UserId } from '../../domain/user-id';
import { UserEmail } from '../../domain/user-email';
import { UserRole } from '../../domain/user-role';
import type { UserRepository } from '../../domain/user.repository';
import { TypeOrmUserEntity } from './typeorm-user.entity';

/**
 * TypeORM-backed implementation of the {@link UserRepository} port.
 *
 * Converts between the domain {@link User} aggregate and the
 * {@link TypeOrmUserEntity} persistence model. Uses the TypeORM
 * {@link Repository} pattern via {@link DataSource}.
 *
 * The repository handles the mapping of the domain's single `role`
 * to the database's `roles` JSON array column, and vice versa.
 */
@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  private readonly repository: Repository<TypeOrmUserEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = dataSource.getRepository(TypeOrmUserEntity);
  }

  /**
   * Persists a User aggregate.
   *
   * Creates a new record if the user does not exist, or updates an
   * existing record. TypeORM's {@link Repository.save} uses the
   * primary key to determine insert vs. update and checks the
   * {@link VersionColumn} for optimistic concurrency control.
   *
   * @param user - The User aggregate to save.
   */
  async save(user: User): Promise<void> {
    const entity = this.toEntity(user);
    await this.repository.save(entity);
  }

  /**
   * Finds a user by their unique identifier.
   *
   * @param id - The UserId to search for.
   * @returns The User aggregate, or `null` if not found.
   */
  async findById(id: UserId): Promise<User | null> {
    const entity = await this.repository.findOne({
      where: { id: id.toString() },
    });

    return entity ? this.toDomain(entity) : null;
  }

  /**
   * Finds a user by their email address.
   *
   * @param email - The email address to search for.
   * @returns The User aggregate, or `null` if not found.
   */
  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.repository.findOne({
      where: { email },
    });

    return entity ? this.toDomain(entity) : null;
  }

  /**
   * Converts a domain User to a TypeORM entity for persistence.
   *
   * The domain model stores a single `role`, which is wrapped into
   * a single-element `roles` array for the database column.
   *
   * @param user - The domain User aggregate.
   * @returns A TypeORM entity ready for persistence.
   */
  private toEntity(user: User): TypeOrmUserEntity {
    const entity = new TypeOrmUserEntity();
    entity.id = user.id;
    entity.email = user.email;
    entity.passwordHash = user.passwordHash;
    entity.roles = [user.role];
    entity.companyId = user.companyId;
    entity.isActive = user.isActive;
    entity.version = user.version;
    return entity;
  }

  /**
   * Converts a TypeORM entity back to a domain User aggregate.
   *
   * Uses the domain's static `reconstitute` factory to bypass the
   * registration flow. The first element of the `roles` array is used
   * as the single domain role.
   *
   * @param entity - The TypeORM entity from the database.
   * @returns A reconstituted domain User aggregate.
   */
  private toDomain(entity: TypeOrmUserEntity): User {
    return User.reconstitute({
      id: entity.id,
      email: UserEmail.from(entity.email),
      role: (entity.roles?.[0] as UserRole) ?? UserRole.EMPLOYEE,
      companyId: entity.companyId,
      passwordHash: entity.passwordHash,
      isActive: entity.isActive,
      version: entity.version,
    });
  }
}
