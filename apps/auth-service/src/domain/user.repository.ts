import { User } from './user.entity';
import { UserId } from './user-id';

/**
 * Port interface for User repository operations.
 *
 * Defines the contract for persisting and retrieving User aggregates.
 * The implementation lives in the infrastructure layer (TypeORM).
 */
export interface UserRepository {
  /**
   * Persists a User aggregate.
   *
   * Creates a new record if the user does not exist, or updates
   * an existing record. The implementation MUST check the version
   * field for optimistic concurrency control.
   *
   * @param user - The User aggregate to save.
   */
  save(user: User): Promise<void>;

  /**
   * Finds a user by their unique identifier.
   *
   * @param id - The UserId to search for.
   * @returns The User aggregate, or `null` if not found.
   */
  findById(id: UserId): Promise<User | null>;

  /**
   * Finds a user by their email address.
   *
   * @param email - The email address to search for.
   * @returns The User aggregate, or `null` if not found.
   */
  findByEmail(email: string): Promise<User | null>;
}
