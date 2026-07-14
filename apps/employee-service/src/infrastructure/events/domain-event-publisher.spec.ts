import { EmployeeDomainEventPublisherImpl } from './domain-event-publisher';
import type { DomainEvent } from '@payroll/shared-kernel';
import { EmployeeCreatedEvent } from '../../domain/events/employee-created.event';

/**
 * Minimal domain event implementation used to test the publisher.
 */
class TestDomainEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventType: string;
  readonly version: number;
  readonly occurredAt: Date;
  readonly companyId: string;
  readonly aggregateId: string;
  readonly payload: Record<string, unknown>;

  constructor() {
    this.eventId = 'test-event-id';
    this.eventType = 'test.event';
    this.version = 1;
    this.occurredAt = new Date();
    this.companyId = 'test-company';
    this.aggregateId = 'test-aggregate';
    this.payload = { key: 'value' };
  }
}

describe('EmployeeDomainEventPublisherImpl', () => {
  let publisher: EmployeeDomainEventPublisherImpl;

  beforeEach(() => {
    publisher = new EmployeeDomainEventPublisherImpl();
  });

  describe('publish', () => {
    it('should accept a domain event without throwing', async () => {
      const event = new TestDomainEvent();

      await expect(publisher.publish(event)).resolves.toBeUndefined();
    });

    it('should accept an EmployeeCreated domain event', async () => {
      const event = new EmployeeCreatedEvent({
        employeeId: 'emp-123',
        name: 'John Doe',
        email: 'john@example.com',
        companyId: 'comp-1',
        position: 'Engineer',
        department: 'Engineering',
        salaryCents: 500000,
        salaryCurrency: 'USD',
      });

      await expect(publisher.publish(event)).resolves.toBeUndefined();
    });

    it('should handle publishing multiple events sequentially', async () => {
      const event1 = new TestDomainEvent();
      const event2 = new TestDomainEvent();

      // Resolving without throwing proves the publisher handles
      // sequential calls without errors.
      await expect(
        (async () => {
          await publisher.publish(event1);
          await publisher.publish(event2);
        })(),
      ).resolves.toBeUndefined();
    });
  });
});
