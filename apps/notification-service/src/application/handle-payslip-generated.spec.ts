import { EventEnvelope } from '@payroll/contracts';
import { HandlePayslipGenerated, PayslipGeneratedPayload } from './handle-payslip-generated';
import { ProcessedEventStore } from '../domain/processed-event-store';
import { OutboxStore } from '@payroll/transactional-outbox';

describe('HandlePayslipGenerated', () => {
  let processedEventStore: jest.Mocked<ProcessedEventStore>;
  let outboxStore: jest.Mocked<OutboxStore>;
  let handler: HandlePayslipGenerated;

  const mockEvent: EventEnvelope<PayslipGeneratedPayload> = {
    eventId: 'evt-payslip-001',
    eventType: 'PayslipGenerated',
    version: 1,
    timestamp: '2026-07-15T10:00:00Z',
    companyId: 'company-001',
    correlationId: 'corr-001',
    causationId: 'cause-001',
    producer: 'payroll-processing-service',
    payload: {
      employeeId: 'emp-001',
      companyId: 'company-001',
      period: '2026-07',
      grossPayCents: 500000,
      netPayCents: 425000,
      currency: 'USD',
      payslipUrl: 'https://payslips.example.com/emp-001/2026-07.pdf',
    },
  };

  beforeEach(() => {
    processedEventStore = {
      exists: jest.fn(),
      markProcessed: jest.fn(),
    };

    outboxStore = {
      save: jest.fn(),
    };

    handler = new HandlePayslipGenerated(processedEventStore, outboxStore);
  });

  it('should create a notification request and save outbox events when event is new', async () => {
    processedEventStore.exists.mockResolvedValue(false);

    await handler.handle(mockEvent);

    // Should mark the event as processed
    expect(processedEventStore.exists).toHaveBeenCalledWith('evt-payslip-001');
    expect(processedEventStore.markProcessed).toHaveBeenCalledWith(
      'evt-payslip-001',
      expect.any(String),
    );

    // Should save outbox events via OutboxStore
    // NotificationRequested + EmailNotificationRequested
    expect(outboxStore.save).toHaveBeenCalledTimes(2);
    expect(outboxStore.save).toHaveBeenNthCalledWith(1, {
      id: expect.any(String),
      eventType: 'NotificationRequested',
      aggregateId: expect.any(String),
      payload: expect.objectContaining({
        notificationId: expect.any(String),
        recipientId: 'emp-001',
        type: 'EMAIL',
      }),
    });
    expect(outboxStore.save).toHaveBeenNthCalledWith(2, {
      id: expect.any(String),
      eventType: 'EmailNotificationRequested',
      aggregateId: expect.any(String),
      payload: expect.objectContaining({
        notificationId: expect.any(String),
        recipientId: 'emp-001',
        type: 'EMAIL',
      }),
    });
  });

  it('should skip processing when event was already handled', async () => {
    processedEventStore.exists.mockResolvedValue(true);

    await handler.handle(mockEvent);

    // Should NOT create outbox events or mark as processed again
    expect(processedEventStore.markProcessed).not.toHaveBeenCalled();
    expect(outboxStore.save).not.toHaveBeenCalled();
  });

  it('should extract recipientId from the employeeId in the event payload', async () => {
    processedEventStore.exists.mockResolvedValue(false);

    await handler.handle(mockEvent);

    // The notification should be addressed to the employee
    const savedEvent = outboxStore.save.mock.calls[0][0];
    const payload = savedEvent.payload as Record<string, string>;
    expect(payload.recipientId).toBe('emp-001');
  });

  it('should propagate errors from the outbox store', async () => {
    processedEventStore.exists.mockResolvedValue(false);
    outboxStore.save.mockRejectedValue(new Error('Database connection lost'));

    await expect(handler.handle(mockEvent)).rejects.toThrow('Database connection lost');
  });
});
