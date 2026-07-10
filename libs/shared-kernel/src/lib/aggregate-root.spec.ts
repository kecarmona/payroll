import { AggregateRoot } from './aggregate-root';
import { DomainEvent } from './domain-event';
import { Entity } from './entity';

class TestEvent implements DomainEvent<string> {
  readonly eventId: string;
  readonly eventType: string;
  readonly version: number;
  readonly occurredAt: Date;
  readonly companyId: string;
  readonly aggregateId: string;
  readonly payload: string;

  constructor(eventId: string, aggregateId: string) {
    this.eventId = eventId;
    this.eventType = 'test.event';
    this.version = 1;
    this.occurredAt = new Date();
    this.companyId = 'test-company';
    this.aggregateId = aggregateId;
    this.payload = 'test';
  }
}

class TestAggregate extends AggregateRoot<string> {
  constructor(id: string, companyId: string, version = 0) {
    super(id, companyId, version);
  }
}

describe('AggregateRoot', () => {
  describe('event recording', () => {
    it('should return an empty array when no events recorded', () => {
      const aggregate = new TestAggregate('id-1', 'company-1');
      expect(aggregate.pullEvents()).toEqual([]);
    });

    it('should return recorded events via pullEvents', () => {
      const aggregate = new TestAggregate('id-1', 'company-1');
      const event = new TestEvent('evt-1', 'id-1');
      aggregate.recordEvent(event);

      const events = aggregate.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBe(event);
    });

    it('should clear events after pullEvents is called', () => {
      const aggregate = new TestAggregate('id-1', 'company-1');
      aggregate.recordEvent(new TestEvent('evt-1', 'id-1'));

      const firstPull = aggregate.pullEvents();
      expect(firstPull).toHaveLength(1);

      const secondPull = aggregate.pullEvents();
      expect(secondPull).toEqual([]);
    });

    it('should clear events via clearEvents without returning them', () => {
      const aggregate = new TestAggregate('id-1', 'company-1');
      aggregate.recordEvent(new TestEvent('evt-1', 'id-1'));

      aggregate.clearEvents();
      expect(aggregate.pullEvents()).toEqual([]);
    });

    it('should support multiple recorded events', () => {
      const aggregate = new TestAggregate('id-1', 'company-1');
      aggregate.recordEvent(new TestEvent('evt-1', 'id-1'));
      aggregate.recordEvent(new TestEvent('evt-2', 'id-1'));

      const events = aggregate.pullEvents();
      expect(events).toHaveLength(2);
    });
  });

  describe('version assertion', () => {
    it('should not throw when expected version matches', () => {
      const aggregate = new TestAggregate('id-1', 'company-1', 2);
      expect(() => aggregate.assertVersion(2)).not.toThrow();
    });

    it('should throw when expected version does not match', () => {
      const aggregate = new TestAggregate('id-1', 'company-1', 2);
      expect(() => aggregate.assertVersion(1)).toThrow();
    });
  });

  describe('inheritance', () => {
    it('should extend Entity', () => {
      const aggregate = new TestAggregate('id-1', 'company-1');
      expect(aggregate).toBeInstanceOf(Entity);
    });

    it('should expose Entity properties', () => {
      const aggregate = new TestAggregate('id-1', 'company-1', 3);
      expect(aggregate.id).toBe('id-1');
      expect(aggregate.companyId).toBe('company-1');
      expect(aggregate.version).toBe(3);
    });
  });
});
