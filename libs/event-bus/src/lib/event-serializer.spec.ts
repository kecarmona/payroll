import { EventEnvelope } from '@payroll/contracts';
import { EventSerializer } from './event-serializer';

describe('EventSerializer', () => {
  it('should be defined as an interface', () => {
    // This is a structural test — verifying the interface contract is sound
    const mockSerializer: EventSerializer = {
      serialize: <T>(_event: EventEnvelope<T>): Buffer => {
        return Buffer.from(JSON.stringify(_event));
      },
    };

    expect(mockSerializer).toBeDefined();
    expect(typeof mockSerializer.serialize).toBe('function');
  });

  it('should return a Buffer when serialize is called', () => {
    const mockSerializer: EventSerializer = {
      serialize: <T>(event: EventEnvelope<T>): Buffer => {
        return Buffer.from(JSON.stringify(event));
      },
    };

    const envelope: EventEnvelope = {
      eventId: 'evt-001',
      eventType: 'TestEvent',
      version: 1,
      timestamp: '2026-07-10T00:00:00.000Z',
      companyId: 'comp-001',
      correlationId: 'corr-001',
      causationId: 'caus-001',
      producer: 'test-service',
      payload: { key: 'value' },
    };

    const result = mockSerializer.serialize(envelope);

    expect(result).toBeInstanceOf(Buffer);
    expect(result.byteLength).toBeGreaterThan(0);
  });

  it('should preserve envelope metadata and payload in the buffer', () => {
    const mockSerializer: EventSerializer = {
      serialize: <T>(event: EventEnvelope<T>): Buffer => {
        return Buffer.from(JSON.stringify(event));
      },
    };

    const envelope: EventEnvelope = {
      eventId: 'evt-002',
      eventType: 'PayrollJobCreated',
      version: 1,
      timestamp: '2026-07-10T00:00:00.000Z',
      companyId: 'comp-002',
      correlationId: 'corr-002',
      causationId: 'caus-002',
      producer: 'payroll-service',
      payload: { jobId: 'job-001', period: '2026-01' },
    };

    const result = mockSerializer.serialize(envelope);
    const parsed = JSON.parse(result.toString());

    expect(parsed.eventId).toBe('evt-002');
    expect(parsed.eventType).toBe('PayrollJobCreated');
    expect(parsed.payload.jobId).toBe('job-001');
  });
});
