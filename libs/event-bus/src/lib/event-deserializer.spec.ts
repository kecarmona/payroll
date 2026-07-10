import { EventEnvelope } from '@payroll/contracts';
import { EventDeserializer } from './event-deserializer';

describe('EventDeserializer', () => {
  it('should be defined as an interface', () => {
    const mockDeserializer: EventDeserializer = {
      deserialize: <T>(_data: Buffer): EventEnvelope<T> => {
        return JSON.parse(_data.toString()) as EventEnvelope<T>;
      },
    };

    expect(mockDeserializer).toBeDefined();
    expect(typeof mockDeserializer.deserialize).toBe('function');
  });

  it('should return an EventEnvelope when deserialize is called', () => {
    const mockDeserializer: EventDeserializer = {
      deserialize: <T>(data: Buffer): EventEnvelope<T> => {
        return JSON.parse(data.toString()) as EventEnvelope<T>;
      },
    };

    const buffer = Buffer.from(
      JSON.stringify({
        eventId: 'evt-001',
        eventType: 'TestEvent',
        version: 1,
        timestamp: '2026-07-10T00:00:00.000Z',
        companyId: 'comp-001',
        correlationId: 'corr-001',
        causationId: 'caus-001',
        producer: 'test-service',
        payload: { key: 'value' },
      }),
    );

    const result = mockDeserializer.deserialize(buffer);

    expect(result).toBeDefined();
    expect(result.eventId).toBe('evt-001');
    expect(result.eventType).toBe('TestEvent');
    expect(result.payload).toEqual({ key: 'value' });
  });

  it('should preserve typed payload through deserialization', () => {
    interface PayrollPayload {
      jobId: string;
      period: string;
    }

    const mockDeserializer: EventDeserializer = {
      deserialize: <T>(data: Buffer): EventEnvelope<T> => {
        return JSON.parse(data.toString()) as EventEnvelope<T>;
      },
    };

    const buffer = Buffer.from(
      JSON.stringify({
        eventId: 'evt-003',
        eventType: 'PayrollJobCreated',
        version: 1,
        timestamp: '2026-07-10T00:00:00.000Z',
        companyId: 'comp-003',
        correlationId: 'corr-003',
        causationId: 'caus-003',
        producer: 'payroll-service',
        payload: { jobId: 'job-001', period: '2026-01' },
      }),
    );

    const result = mockDeserializer.deserialize<PayrollPayload>(buffer);

    expect(result.payload.jobId).toBe('job-001');
    expect(result.payload.period).toBe('2026-01');
  });
});
