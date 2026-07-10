import { EventEnvelope } from './event-envelope';
import { PayrollEventType } from './payroll-events';
import { EVENT_VERSIONS } from './event-versions';

describe('EventEnvelope', () => {
  it('should accept a valid payroll event envelope', () => {
    const envelope: EventEnvelope = {
      eventId: 'evt_123abc',
      eventType: PayrollEventType.PayrollJobCreated,
      version: EVENT_VERSIONS.PayrollJobCreated,
      timestamp: '2026-07-10T12:00:00.000Z',
      companyId: 'company_001',
      correlationId: 'corr_001',
      causationId: 'caus_001',
      producer: 'payroll-service',
      payload: { jobId: 'job_001', period: '2026-07' },
    };

    expect(envelope.eventId).toBe('evt_123abc');
    expect(envelope.eventType).toBe('PayrollJobCreated');
    expect(envelope.version).toBe(1);
    expect(envelope.timestamp).toBe('2026-07-10T12:00:00.000Z');
    expect(envelope.companyId).toBe('company_001');
    expect(envelope.correlationId).toBe('corr_001');
    expect(envelope.causationId).toBe('caus_001');
    expect(envelope.producer).toBe('payroll-service');
    expect(envelope.payload).toEqual({ jobId: 'job_001', period: '2026-07' });
  });

  it('should accept an identity event envelope', () => {
    const envelope: EventEnvelope = {
      eventId: 'evt_456def',
      eventType: 'UserRegistered',
      version: 1,
      timestamp: '2026-07-10T12:00:00.000Z',
      companyId: 'company_001',
      correlationId: 'corr_002',
      causationId: 'caus_002',
      producer: 'auth-service',
      payload: { userId: 'user_001', email: 'test@example.com' },
    };

    expect(envelope.eventType).toBe('UserRegistered');
    expect(envelope.producer).toBe('auth-service');
  });

  it('should accept typed payload via generic parameter', () => {
    interface PayrollPayload {
      jobId: string;
      period: string;
    }

    const envelope: EventEnvelope<PayrollPayload> = {
      eventId: 'evt_789ghi',
      eventType: PayrollEventType.PayrollJobCreated,
      version: 1,
      timestamp: '2026-07-10T12:00:00.000Z',
      companyId: 'company_001',
      correlationId: 'corr_003',
      causationId: 'caus_003',
      producer: 'payroll-service',
      payload: { jobId: 'job_002', period: '2026-08' },
    };

    expect(envelope.payload.jobId).toBe('job_002');
    expect(envelope.payload.period).toBe('2026-08');
  });
});
