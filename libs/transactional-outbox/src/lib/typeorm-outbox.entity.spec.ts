import { TypeOrmOutboxEntity } from './typeorm-outbox.entity';

describe('TypeOrmOutboxEntity', () => {
  it('should create an entity instance with default values', () => {
    const entity = new TypeOrmOutboxEntity();
    entity.id = 'evt-001';
    entity.eventType = 'PayrollJobCreated';
    entity.aggregateId = 'job-456';
    entity.payload = { jobId: 'job-456' };

    expect(entity.id).toBe('evt-001');
    expect(entity.eventType).toBe('PayrollJobCreated');
    expect(entity.aggregateId).toBe('job-456');
    expect(entity.payload).toEqual({ jobId: 'job-456' });
    expect(entity.retryCount).toBe(0);
    expect(entity.lastError).toBeNull();
  });

  it('should support nullable publishedAt (pending state)', () => {
    const entity = new TypeOrmOutboxEntity();
    entity.id = 'evt-002';
    entity.eventType = 'TestEvent';
    entity.aggregateId = 'agg-001';
    entity.payload = { key: 'value' };

    expect(entity.publishedAt).toBeNull();
  });

  it('should accept a publishedAt timestamp after publication', () => {
    const entity = new TypeOrmOutboxEntity();
    entity.id = 'evt-003';
    entity.eventType = 'TestEvent';
    entity.aggregateId = 'agg-001';
    entity.payload = {};
    entity.publishedAt = new Date('2026-07-14T12:00:00Z');

    expect(entity.publishedAt).toBeInstanceOf(Date);
    expect(entity.publishedAt!.toISOString()).toBe('2026-07-14T12:00:00.000Z');
  });

  it('should allow retryCount to be incremented', () => {
    const entity = new TypeOrmOutboxEntity();
    entity.id = 'evt-004';
    entity.eventType = 'TestEvent';
    entity.aggregateId = 'agg-001';
    entity.payload = {};
    entity.retryCount = 3;
    entity.lastError = 'Kafka connection refused';

    expect(entity.retryCount).toBe(3);
    expect(entity.lastError).toBe('Kafka connection refused');
  });
});
