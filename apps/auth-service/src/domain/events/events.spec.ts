import { IdentityEventType } from '@payroll/contracts';
import { UserRegisteredEvent } from './user-registered.event';
import { UserDeactivatedEvent } from './user-deactivated.event';

describe('UserRegisteredEvent', () => {
  it('should create a UserRegistered domain event', () => {
    const event = new UserRegisteredEvent({
      userId: 'usr-123',
      email: 'user@example.com',
      role: 'ADMIN',
      companyId: 'comp-1',
    });

    expect(event.eventType).toBe(IdentityEventType.UserRegistered);
    expect(event.version).toBe(1);
    expect(event.aggregateId).toBe('usr-123');
    expect(event.companyId).toBe('comp-1');
    expect(event.eventId).toBeDefined();
    expect(event.occurredAt).toBeInstanceOf(Date);
    expect(event.payload).toEqual({
      userId: 'usr-123',
      email: 'user@example.com',
      role: 'ADMIN',
      companyId: 'comp-1',
    });
  });
});

describe('UserDeactivatedEvent', () => {
  it('should create a UserDeactivated domain event', () => {
    const event = new UserDeactivatedEvent({
      userId: 'usr-123',
      companyId: 'comp-1',
    });

    expect(event.eventType).toBe(IdentityEventType.UserDeactivated);
    expect(event.version).toBe(1);
    expect(event.aggregateId).toBe('usr-123');
    expect(event.companyId).toBe('comp-1');
    expect(event.eventId).toBeDefined();
    expect(event.occurredAt).toBeInstanceOf(Date);
    expect(event.payload).toEqual({
      userId: 'usr-123',
      companyId: 'comp-1',
    });
  });
});
