import { AggregateRoot } from '@payroll/shared-kernel';
import { UserId } from './user-id';
import { UserEmail } from './user-email';
import { UserRole } from './user-role';
import { UserRegisteredEvent } from './events/user-registered.event';
import { UserDeactivatedEvent } from './events/user-deactivated.event';
import type { PasswordHasher } from './password-hasher';

/**
 * User aggregate root — the central entity of the Identity bounded context.
 *
 * The User aggregate manages authentication credentials, role assignment,
 * and account lifecycle. It records domain events for state changes that
 * must be published to other bounded contexts.
 *
 * @example
 * ```ts
 * const user = await User.register(
 *   UserId.create(),
 *   UserEmail.from('user@example.com'),
 *   UserRole.EMPLOYEE,
 *   'company-1',
 *   'securePassword123',
 *   passwordHasher,
 * );
 * ```
 */
export class User extends AggregateRoot<string> {
  private readonly _email: UserEmail;
  private readonly _role: UserRole;
  private readonly _passwordHash: string;
  private _isActive: boolean;

  private constructor(
    id: string,
    email: UserEmail,
    role: UserRole,
    companyId: string,
    passwordHash: string,
    isActive: boolean,
    version?: number,
  ) {
    super(id, companyId, version);
    this._email = email;
    this._role = role;
    this._passwordHash = passwordHash;
    this._isActive = isActive;
  }

  /** Returns the email address. */
  get email(): string {
    return this._email.value;
  }

  /** Returns the user's role. */
  get role(): UserRole {
    return this._role;
  }

  /** Returns the bcrypt hash of the user's password. */
  get passwordHash(): string {
    return this._passwordHash;
  }

  /** Whether the user account is active and allowed to authenticate. */
  get isActive(): boolean {
    return this._isActive;
  }

  /**
   * Reconstitutes a User from persisted data.
   *
   * This is the reconstruction path used by repositories when loading
   * users from the database, bypassing the registration flow.
   *
   * @param props - All persisted properties of the user.
   * @returns A reconstituted User instance.
   */
  static reconstitute(props: {
    id: string;
    email: UserEmail;
    role: UserRole;
    companyId: string;
    passwordHash: string;
    isActive: boolean;
    version: number;
  }): User {
    return new User(
      props.id,
      props.email,
      props.role,
      props.companyId,
      props.passwordHash,
      props.isActive,
      props.version,
    );
  }

  /**
   * Registers a new user with the given credentials.
   *
   * Hashes the password using the provided `PasswordHasher`, creates the
   * User aggregate, and records a `UserRegisteredEvent`.
   *
   * @param userId - The unique identifier for the new user.
   * @param email - The user's email address.
   * @param role - The role to assign.
   * @param companyId - The tenant identifier.
   * @param password - The plain-text password to hash and store.
   * @param hasher - The password hashing implementation.
   * @returns A new active User instance with a recorded UserRegistered event.
   */
  static async register(
    userId: UserId,
    email: UserEmail,
    role: UserRole,
    companyId: string,
    password: string,
    hasher: PasswordHasher,
  ): Promise<User> {
    const passwordHash = await hasher.hash(password);

    const user = new User(
      userId.toString(),
      email,
      role,
      companyId,
      passwordHash,
      true,
      0,
    );

    user.recordEvent(
      new UserRegisteredEvent({
        userId: userId.toString(),
        email: email.value,
        role,
        companyId,
      }),
    );

    return user;
  }

  /**
   * Authenticates the user with the given password.
   *
   * Returns `false` if the user is deactivated or if the password does
   * not match the stored hash.
   *
   * @param password - The plain-text password to verify.
   * @param hasher - The password hashing implementation.
   * @returns `true` if the password is correct and the user is active.
   */
  async authenticate(password: string, hasher: PasswordHasher): Promise<boolean> {
    if (!this._isActive) {
      return false;
    }

    return hasher.verify(password, this._passwordHash);
  }

  /**
   * Deactivates the user account.
   *
   * If the user is already deactivated, this is a no-op (idempotent).
   * Records a `UserDeactivatedEvent` only when the state actually changes.
   */
  deactivate(): void {
    if (!this._isActive) {
      return; // idempotent
    }

    this._isActive = false;

    this.recordEvent(
      new UserDeactivatedEvent({
        userId: this.id,
        companyId: this.companyId,
      }),
    );
  }
}
