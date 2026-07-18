import { ValidationError } from '@payroll/shared-kernel';
import type { DomainEvent } from '@payroll/shared-kernel';
import { User } from '../domain/user.entity';
import { UserId } from '../domain/user-id';
import { UserRole } from '../domain/user-role';
import type { UserRepository } from '../domain/user.repository';
import type { PasswordHasher } from '../domain/password-hasher';
import type { EventPublisher } from '../domain/event-publisher';
import { RegisterUserCommand, RegisterUserHandler } from './register-user.command';

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

describe('RegisterUserHandler', () => {
  let userRepository: InMemoryUserRepository;
  let passwordHasher: FakePasswordHasher;
  let eventPublisher: FakeEventPublisher;
  let handler: RegisterUserHandler;

  beforeEach(() => {
    userRepository = new InMemoryUserRepository();
    passwordHasher = new FakePasswordHasher();
    eventPublisher = new FakeEventPublisher();
    handler = new RegisterUserHandler(userRepository, passwordHasher, eventPublisher);
  });

  describe('execute', () => {
    it('should register a new user and return the userId', async () => {
      const command = new RegisterUserCommand(
        'newuser@example.com',
        'securePass123',
        UserRole.EMPLOYEE,
        'company-1',
      );

      const userId = await handler.execute(command);

      expect(userId).toBeDefined();
      expect(userId.length).toBeGreaterThan(0);

      // Verify the user was persisted
      const saved = await userRepository.findByEmail('newuser@example.com');
      expect(saved).not.toBeNull();
      expect(saved!.email).toBe('newuser@example.com');
      expect(saved!.role).toBe(UserRole.EMPLOYEE);
      expect(saved!.isActive).toBe(true);
    });

    it('should hash the password before saving', async () => {
      const command = new RegisterUserCommand(
        'hashcheck@example.com',
        'myPassword',
        UserRole.HR,
        'company-1',
      );

      await handler.execute(command);

      const saved = await userRepository.findByEmail('hashcheck@example.com');
      expect(saved!.passwordHash).toBe('hashed:myPassword');
    });

    it('should publish a UserRegistered event after saving', async () => {
      const command = new RegisterUserCommand(
        'eventcheck@example.com',
        'password123',
        UserRole.ADMIN,
        'company-1',
      );

      await handler.execute(command);

      expect(eventPublisher.published).toHaveLength(1);
      expect(eventPublisher.published[0].eventType).toBe('UserRegistered');
      expect(eventPublisher.published[0].aggregateId).toBeDefined();
    });

    it('should throw ValidationError when email already exists', async () => {
      // First registration
      const command1 = new RegisterUserCommand(
        'duplicate@example.com',
        'password123',
        UserRole.EMPLOYEE,
        'company-1',
      );
      await handler.execute(command1);

      // Second registration with same email
      const command2 = new RegisterUserCommand(
        'duplicate@example.com',
        'anotherPassword',
        UserRole.HR,
        'company-1',
      );

      await expect(handler.execute(command2)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError with field "email" for duplicate', async () => {
      const command1 = new RegisterUserCommand(
        'dup@example.com',
        'password123',
        UserRole.EMPLOYEE,
        'company-1',
      );
      await handler.execute(command1);

      const command2 = new RegisterUserCommand(
        'dup@example.com',
        'otherPass',
        UserRole.HR,
        'company-1',
      );

      let error: Error | null = null;
      try {
        await handler.execute(command2);
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeInstanceOf(ValidationError);
      if (error instanceof ValidationError) {
        expect(error.field).toBe('email');
      }
    });
  });
});
