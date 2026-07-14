import { PayrollEventType } from '@payroll/contracts';
import { PayrollPeriodCreatedEvent } from './payroll-period-created.event';
import { PayrollJobCreatedEvent } from './payroll-job-created.event';

describe('PayrollPeriodCreatedEvent', () => {
  it('should create a PayrollPeriodCreated domain event', () => {
    const event = new PayrollPeriodCreatedEvent({
      periodId: 'pp-123',
      companyId: 'comp-1',
      month: 1,
      year: 2026,
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    });

    expect(event.eventType).toBe('PayrollPeriodCreated');
    expect(event.version).toBe(1);
    expect(event.aggregateId).toBe('pp-123');
    expect(event.companyId).toBe('comp-1');
    expect(event.eventId).toBeDefined();
    expect(event.occurredAt).toBeInstanceOf(Date);
    expect(event.payload).toEqual({
      periodId: 'pp-123',
      companyId: 'comp-1',
      month: 1,
      year: 2026,
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    });
  });
});

describe('PayrollJobCreatedEvent', () => {
  it('should create a PayrollJobCreated domain event', () => {
    const event = new PayrollJobCreatedEvent({
      jobId: 'pj-123',
      companyId: 'comp-1',
      periodId: 'pp-123',
      timestamp: '2026-07-14T12:00:00.000Z',
    });

    expect(event.eventType).toBe(PayrollEventType.PayrollJobCreated);
    expect(event.version).toBe(1);
    expect(event.aggregateId).toBe('pj-123');
    expect(event.companyId).toBe('comp-1');
    expect(event.eventId).toBeDefined();
    expect(event.occurredAt).toBeInstanceOf(Date);
    expect(event.payload).toEqual({
      jobId: 'pj-123',
      companyId: 'comp-1',
      periodId: 'pp-123',
      timestamp: '2026-07-14T12:00:00.000Z',
    });
  });
});
