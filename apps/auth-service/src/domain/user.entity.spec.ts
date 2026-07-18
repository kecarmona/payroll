import { IdentityEventType } from '@payroll/contracts';
import { User } from './user.entity';
import { UserId } from './user-id';
import { UserEmail } from './user-email';
import { UserRole } from './user-role';
import { PasswordHasher } from './password-hasher';

class FakePasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    return `hashed:${password}`;
  }

  async verify(password: string, hash: string): Promise<boolean> {
    return hash === `hashed:${password}`;
  }
}

describe('User', () => {
  const hasher = new FakePasswordHasher();
  const companyId = 'company-1';

  describe('register', () => {
    it('should create a new active user and record UserRegistered event', async () => {
      const userId = UserId.create();
      const email = UserEmail.from('newuser@example.com');

      const user = await User.register(
        userId,
        email,
        UserRole.EMPLOYEE,
        companyId,
        'securePass123',
        hasher,
      );

      expect(user.id).toBe(userId.toString());
      expect(user.email).toBe('newuser@example.com');
      expect(user.role).toBe(UserRole.EMPLOYEE);
      expect(user.isActive).toBe(true);
      expect(user.passwordHash).toBe('hashed:securePass123');

      const events = user.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe(IdentityEventType.UserRegistered);
      expect(events[0].aggregateId).toBe(userId.toString());
    });
  });

  describe('authenticate', () => {
    it('should succeed with correct password for active user', async () => {
      const userId = UserId.create();
      const email = UserEmail.from('auth@example.com');

      const user = await User.register(
        userId,
        email,
        UserRole.EMPLOYEE,
        companyId,
        'correctPassword',
        hasher,
      );

      const result = await user.authenticate('correctPassword', hasher);
      expect(result).toBe(true);
    });

    it('should fail with incorrect password', async () => {
      const user = await User.register(
        UserId.create(),
        UserEmail.from('fail@example.com'),
        UserRole.EMPLOYEE,
        companyId,
        'realPassword',
        hasher,
      );

      const result = await user.authenticate('wrongPassword', hasher);
      expect(result).toBe(false);
    });

    it('should fail for deactivated user even with correct password', async () => {
      const user = await User.register(
        UserId.create(),
        UserEmail.from('deactivated@example.com'),
        UserRole.HR,
        companyId,
        'securePass',
        hasher,
      );

      // Clear registration events
      user.pullEvents();

      user.deactivate();
      const authResult = await user.authenticate('securePass', hasher);
      expect(authResult).toBe(false);
    });
  });

  describe('deactivate', () => {
    it('should mark user as inactive and record UserDeactivated event', async () => {
      const userId = UserId.create();
      const user = await User.register(
        userId,
        UserEmail.from('deact@example.com'),
        UserRole.ADMIN,
        companyId,
        'somePassword',
        hasher,
      );

      user.pullEvents(); // clear registration events
      user.deactivate();

      expect(user.isActive).toBe(false);

      const events = user.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe(IdentityEventType.UserDeactivated);
      expect(events[0].aggregateId).toBe(userId.toString());
    });

    it('should be idempotent when deactivating an already inactive user', async () => {
      const user = await User.register(
        UserId.create(),
        UserEmail.from('already@example.com'),
        UserRole.EMPLOYEE,
        companyId,
        'password123',
        hasher,
      );

      user.pullEvents(); // clear registration events

      user.deactivate();
      const eventsAfterFirst = user.pullEvents();
      expect(eventsAfterFirst).toHaveLength(1);

      user.deactivate();
      const eventsAfterSecond = user.pullEvents();
      expect(eventsAfterSecond).toHaveLength(0);
    });
  });

  describe('version', () => {
    it('should start with version 0', async () => {
      const user = await User.register(
        UserId.create(),
        UserEmail.from('ver@example.com'),
        UserRole.EMPLOYEE,
        companyId,
        'password',
        hasher,
      );

      expect(user.version).toBe(0);
    });
  });
});
