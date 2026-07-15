import { AuditConsumer } from './audit-consumer';
import { RecordAuditEventHandler } from '../../application/record-audit-event.handler';

describe('AuditConsumer', () => {
  let consumer: AuditConsumer;
  let mockHandler: jest.Mocked<RecordAuditEventHandler>;

  beforeEach(() => {
    mockHandler = {
      handle: jest.fn(),
    } as unknown as jest.Mocked<RecordAuditEventHandler>;

    consumer = new AuditConsumer(mockHandler);
  });

  describe('handleAuditEvent', () => {
    it('should deserialize the message and delegate to the handler', async () => {
      const message = {
        value: Buffer.from(
          JSON.stringify({
            eventId: 'evt-abc',
            eventType: 'PayrollJobCreated',
            companyId: 'comp-1',
            correlationId: 'corr-xyz',
            timestamp: '2026-07-01T10:00:00.000Z',
            payload: { jobId: 'job-001' },
          }),
        ),
      };

      mockHandler.handle.mockResolvedValue(undefined);

      await consumer.handleAuditEvent(message);

      expect(mockHandler.handle).toHaveBeenCalledTimes(1);
      expect(mockHandler.handle).toHaveBeenCalledWith({
        eventId: 'evt-abc',
        eventType: 'PayrollJobCreated',
        companyId: 'comp-1',
        correlationId: 'corr-xyz',
        payload: { jobId: 'job-001' },
        occurredAt: expect.any(Date),
      });
    });

    it('should throw for invalid JSON in the message value', async () => {
      const message = {
        value: Buffer.from('not-json'),
      };

      await expect(consumer.handleAuditEvent(message)).rejects.toThrow();
    });

    it('should throw when the message value is empty', async () => {
      const message = {
        value: Buffer.from(''),
      };

      await expect(consumer.handleAuditEvent(message)).rejects.toThrow();
    });

    it('should throw for missing required fields in the event', async () => {
      const message = {
        value: Buffer.from(
          JSON.stringify({
            // Missing eventId, eventType, companyId, payload
            correlationId: 'corr-xyz',
          }),
        ),
      };

      await expect(consumer.handleAuditEvent(message)).rejects.toThrow();
    });

    it('should handle all audited event types', async () => {
      mockHandler.handle.mockResolvedValue(undefined);

      const auditedTypes = [
        'UserRoleChanged',
        'EmployeeCreated',
        'EmployeeSalaryChanged',
        'EmployeeTerminated',
        'PayrollJobCreated',
        'PayrollJobCompleted',
        'PayrollJobFailed',
        'PayrollTransactionCompleted',
        'PayrollTransactionFailed',
        'PayslipGenerated',
      ];

      for (const eventType of auditedTypes) {
        const message = {
          value: Buffer.from(
            JSON.stringify({
              eventId: `evt-${eventType}`,
              eventType,
              companyId: 'comp-1',
              correlationId: 'corr-xyz',
              timestamp: '2026-07-01T10:00:00.000Z',
              payload: {},
            }),
          ),
        };

        await consumer.handleAuditEvent(message);
      }

      expect(mockHandler.handle).toHaveBeenCalledTimes(auditedTypes.length);
    });
  });
});
