import { PayrollEventType } from '@payroll/contracts';
import { PayrollTransactionCreatedEvent, PayrollTransactionCreatedPayload } from './payroll-transaction-created.event';
import { PayrollTransactionCompletedEvent, PayrollTransactionCompletedPayload } from './payroll-transaction-completed.event';
import { PayrollTransactionFailedEvent, PayrollTransactionFailedPayload } from './payroll-transaction-failed.event';
import { PayslipGeneratedEvent, PayslipGeneratedPayload } from './payslip-generated.event';

describe('PayrollTransactionCreatedEvent', () => {
  it('should create a PayrollTransactionCreated domain event', () => {
    const payload: PayrollTransactionCreatedPayload = {
      transactionId: 'pt-123',
      jobId: 'pj-456',
      employeeId: 'emp-789',
      companyId: 'comp-1',
      periodId: 'pp-001',
      timestamp: '2026-07-14T12:00:00.000Z',
    };

    const event = new PayrollTransactionCreatedEvent(payload);

    expect(event.eventType).toBe(PayrollEventType.PayrollTransactionCreated);
    expect(event.version).toBe(1);
    expect(event.aggregateId).toBe('pt-123');
    expect(event.companyId).toBe('comp-1');
    expect(event.eventId).toBeDefined();
    expect(event.occurredAt).toBeInstanceOf(Date);
    expect(event.payload).toEqual(payload);
  });
});

describe('PayrollTransactionCompletedEvent', () => {
  it('should create a PayrollTransactionCompleted domain event', () => {
    const payload: PayrollTransactionCompletedPayload = {
      transactionId: 'pt-123',
      jobId: 'pj-456',
      employeeId: 'emp-789',
      companyId: 'comp-1',
      periodId: 'pp-001',
      grossPayCents: 500000,
      deductionsCents: 100000,
      netPayCents: 400000,
      currency: 'USD',
      timestamp: '2026-07-14T12:00:00.000Z',
    };

    const event = new PayrollTransactionCompletedEvent(payload);

    expect(event.eventType).toBe(PayrollEventType.PayrollTransactionCompleted);
    expect(event.version).toBe(1);
    expect(event.aggregateId).toBe('pt-123');
    expect(event.companyId).toBe('comp-1');
    expect(event.eventId).toBeDefined();
    expect(event.occurredAt).toBeInstanceOf(Date);
    expect(event.payload).toEqual(payload);
  });
});

describe('PayrollTransactionFailedEvent', () => {
  it('should create a PayrollTransactionFailed domain event', () => {
    const payload: PayrollTransactionFailedPayload = {
      transactionId: 'pt-123',
      jobId: 'pj-456',
      employeeId: 'emp-789',
      companyId: 'comp-1',
      periodId: 'pp-001',
      reason: 'Calculation error: division by zero',
      timestamp: '2026-07-14T12:00:00.000Z',
    };

    const event = new PayrollTransactionFailedEvent(payload);

    expect(event.eventType).toBe(PayrollEventType.PayrollTransactionFailed);
    expect(event.version).toBe(1);
    expect(event.aggregateId).toBe('pt-123');
    expect(event.companyId).toBe('comp-1');
    expect(event.eventId).toBeDefined();
    expect(event.occurredAt).toBeInstanceOf(Date);
    expect(event.payload).toEqual(payload);
  });
});

describe('PayslipGeneratedEvent', () => {
  it('should create a PayslipGenerated domain event', () => {
    const payload: PayslipGeneratedPayload = {
      payslipId: 'ps-123',
      transactionId: 'pt-456',
      jobId: 'pj-789',
      employeeId: 'emp-001',
      companyId: 'comp-1',
      periodId: 'pp-001',
      grossPayCents: 500000,
      deductionsCents: 100000,
      netPayCents: 400000,
      currency: 'USD',
      timestamp: '2026-07-14T12:00:00.000Z',
    };

    const event = new PayslipGeneratedEvent(payload);

    expect(event.eventType).toBe(PayrollEventType.PayslipGenerated);
    expect(event.version).toBe(1);
    expect(event.aggregateId).toBe('ps-123');
    expect(event.companyId).toBe('comp-1');
    expect(event.eventId).toBeDefined();
    expect(event.occurredAt).toBeInstanceOf(Date);
    expect(event.payload).toEqual(payload);
  });
});
