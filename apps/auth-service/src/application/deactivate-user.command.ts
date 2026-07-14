import { NotFoundError } from '@payroll/shared-kernel';
import { UserId } from '../domain/user-id';
import type { UserRepository } from '../domain/user.repository';
import type { EventPublisher } from '../domain/event-publisher';

/**
 * Command to deactivate a user account.
 *
 * Deactivation is idempotent — deactivating an already inactive user
 * is a no-op. The handler records a UserDeactivated domain event only
 * when the state actually changes.
 */
export class DeactivateUserCommand {
  constructor(public readonly userId: string) {}
}

/**
 * Handler for the DeactivateUserCommand.
 *
 * Finds the user by ID, calls deactivate() on the aggregate (which
 * records a UserDeactivated event if the user was active), persists
 * the change, and publishes the recorded events.
 */
export class DeactivateUserHandler {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  /**
   * Executes the deactivation command.
   *
   * @param command - The command containing the userId to deactivate.
   * @throws {NotFoundError} If the user does not exist.
   */
  async execute(command: DeactivateUserCommand): Promise<void> {
    const userId = UserId.from(command.userId);
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError('User', command.userId);
    }

    user.deactivate();

    await this.userRepository.save(user);

    const events = user.pullEvents();
    for (const event of events) {
      await this.eventPublisher.publish(event);
    }
  }
}
