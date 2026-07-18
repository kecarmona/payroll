import { ValidationError } from '@payroll/shared-kernel';
import { User } from '../domain/user.entity';
import { UserId } from '../domain/user-id';
import { UserEmail } from '../domain/user-email';
import { UserRole } from '../domain/user-role';
import type { UserRepository } from '../domain/user.repository';
import type { PasswordHasher } from '../domain/password-hasher';
import type { EventPublisher } from '../domain/event-publisher';

/**
 * Command to register a new user in the system.
 *
 * Contains the essential registration data: email, password, role,
 * and the tenant (company) the user belongs to.
 */
export class RegisterUserCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly role: UserRole,
    public readonly companyId: string,
  ) {}
}

/**
 * Handler for the RegisterUserCommand.
 *
 * Validates that the email is not already registered, creates the
 * User aggregate (which hashes the password via the provided hasher
 * and records a UserRegistered domain event), persists the user,
 * and publishes the recorded events.
 */
export class RegisterUserHandler {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly eventPublisher: EventPublisher,
  ) {}

  /**
   * Executes the registration command.
   *
   * @param command - The registration details.
   * @returns The newly created UserId as a string.
   * @throws {ValidationError} If the email is already registered.
   */
  async execute(command: RegisterUserCommand): Promise<string> {
    const existing = await this.userRepository.findByEmail(command.email);
    if (existing) {
      throw new ValidationError('email', 'A user with this email already exists');
    }

    const userId = UserId.create();
    const email = UserEmail.from(command.email);

    const user = await User.register(
      userId,
      email,
      command.role,
      command.companyId,
      command.password,
      this.passwordHasher,
    );

    await this.userRepository.save(user);

    const events = user.pullEvents();
    for (const event of events) {
      await this.eventPublisher.publish(event);
    }

    return userId.toString();
  }
}
