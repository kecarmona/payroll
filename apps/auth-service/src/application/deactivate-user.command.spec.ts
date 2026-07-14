import { NotFoundError } from '@payroll/shared-kernel';
import type { DomainEvent } from '@payroll/shared-kernel';
import { User } from '../domain/user.entity';
import { UserId } from '../domain/user-id';
import { UserEmail } from '../domain/user-email';
import { UserRole } from '../domain/user-role';
import type { UserRepository } from '../domain/user.repository';
import type { PasswordHasher } from '../domain/password-hasher';
import type { EventPublisher } from '../domain/event-publisher';
import { DeactivateUserCommand, DeactivateUserHandler } from './deactivate-user.command';

// ---------------------------------------------------------------------------
// Fakes
// ---------------------------------------------------------------------------

class FakePasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    return `hashed:${password}`;
  }

  async verify(password: string, hash: string): Promise<boolean> {
    return hash === `hashed:${password}`;
  }
}

class InMemoryUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();

  async save(user: User): Promise<void> {
    this.users.set(user.id, user);
  }

  async findById(id: UserId): Promise<User | null> {
    return this.users.get(id.toString()) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }
}

class FakeEventPublisher implements EventPublisher {
  public published: DomainEvent[] = [];

  async publish(event: DomainEvent): Promise<void> {
    this.published.push(event);
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DeactivateUserHandler', () => {
  let userRepository: InMemoryUserRepository;
  let passwordHasher: FakePasswordHasher;
  let eventPublisher: FakeEventPublisher;
  let handler: DeactivateUserHandler;
  let userId: UserId;

  beforeEach(async () => {
    userRepository = new InMemoryUserRepository();
    passwordHasher = new FakePasswordHasher();
    eventPublisher = new FakeEventPublisher();
    handler = new DeactivateUserHandler(userRepository, eventPublisher);

    // Seed an active user
    userId = UserId.create();
    const email = UserEmail.from('active@example.com');
    const user = await User.register(userId, email, UserRole.EMPLOYEE, 'company-1', 'password', passwordHasher);
    user.pullEvents();
    await userRepository.save(user);
  });

  describe('execute', () => {
    it('should deactivate an active user', async () => {
      const command = new DeactivateUserCommand(userId.toString());

      await handler.execute(command);

      const user = await userRepository.findById(userId);
      expect(user).not.toBeNull();
      expect(user!.isActive).toBe(false);
    });

    it('should publish a UserDeactivated event after deactivation', async () => {
      const command = new DeactivateUserCommand(userId.toString());

      await handler.execute(command);

      expect(eventPublisher.published).toHaveLength(1);
      expect(eventPublisher.published[0].eventType).toBe('UserDeactivated');
    });

    it('should be idempotent when deactivating an already inactive user', async () => {
      // First deactivation
      const command1 = new DeactivateUserCommand(userId.toString());
      await handler.execute(command1);
      const eventsAfterFirst = eventPublisher.published.length;

      // Second deactivation — should be a no-op
      const command2 = new DeactivateUserCommand(userId.toString());
      await handler.execute(command2);

      // No additional event should be published
      expect(eventPublisher.published.length).toBe(eventsAfterFirst);
    });

    it('should throw NotFoundError for non-existent user', async () => {
      const command = new DeactivateUserCommand('non-existent-id');

      await expect(handler.execute(command)).rejects.toThrow(NotFoundError);
    });
  });
});
