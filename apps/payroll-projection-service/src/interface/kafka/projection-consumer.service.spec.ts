import { EventEnvelope } from '@payroll/contracts';
import { ProjectionConsumerService } from './projection-consumer.service';
import { PayrollJobHandler } from '../../application/handlers/payroll-job.handler';
import { PayrollJobCompletedHandler } from '../../application/handlers/payroll-job-completed.handler';
import { TransactionHandler } from '../../application/handlers/transaction.handler';
import { PayslipHandler } from '../../application/handlers/payslip.handler';

function createEvent(overrides: Partial<EventEnvelope>): EventEnvelope {
  return {
    eventId: 'evt-default',
    eventType: 'UnknownEvent',
    version: 1,
    timestamp: '2026-07-15T10:00:00.000Z',
    companyId: 'comp-001',
    correlationId: 'corr-001',
    causationId: 'caus-001',
    producer: 'test',
    payload: {},
    ...overrides,
  };
}

describe('ProjectionConsumerService', () => {
  let consumer: ProjectionConsumerService;
  let mockPayrollJobHandler: { handle: jest.Mock };
  let mockPayrollJobCompletedHandler: { handle: jest.Mock };
  let mockTransactionHandler: { handle: jest.Mock };
  let mockPayslipHandler: { handle: jest.Mock };

  beforeEach(() => {
    mockPayrollJobHandler = { handle: jest.fn() };
    mockPayrollJobCompletedHandler = { handle: jest.fn() };
    mockTransactionHandler = { handle: jest.fn() };
    mockPayslipHandler = { handle: jest.fn() };

    consumer = new ProjectionConsumerService(
      mockPayrollJobHandler as unknown as PayrollJobHandler,
      mockPayrollJobCompletedHandler as unknown as PayrollJobCompletedHandler,
      mockTransactionHandler as unknown as TransactionHandler,
      mockPayslipHandler as unknown as PayslipHandler,
    );
  });

  describe('processEvent', () => {
    it('should route PayrollJobCreated to PayrollJobHandler', async () => {
      const event = createEvent({
        eventId: 'evt-001',
        eventType: 'PayrollJobCreated',
        payload: { jobId: 'job-001' },
      });

      await consumer.processEvent(event);

      expect(mockPayrollJobHandler.handle).toHaveBeenCalledWith(event);
      expect(mockTransactionHandler.handle).not.toHaveBeenCalled();
      expect(mockPayslipHandler.handle).not.toHaveBeenCalled();
    });

    it('should route PayrollTransactionCompleted to TransactionHandler', async () => {
      const event = createEvent({
        eventId: 'evt-002',
        eventType: 'PayrollTransactionCompleted',
        payload: { transactionId: 'tx-001' },
      });

      await consumer.processEvent(event);

      expect(mockTransactionHandler.handle).toHaveBeenCalledWith(event);
    });

    it('should route PayrollTransactionFailed to TransactionHandler', async () => {
      const event = createEvent({
        eventId: 'evt-003',
        eventType: 'PayrollTransactionFailed',
        payload: { transactionId: 'tx-002' },
      });

      await consumer.processEvent(event);

      expect(mockTransactionHandler.handle).toHaveBeenCalledWith(event);
    });

    it('should route PayslipGenerated to PayslipHandler', async () => {
      const event = createEvent({
        eventId: 'evt-004',
        eventType: 'PayslipGenerated',
        payload: { payslipId: 'ps-001' },
      });

      await consumer.processEvent(event);

      expect(mockPayslipHandler.handle).toHaveBeenCalledWith(event);
    });

    it('should silently skip unknown event types', async () => {
      const event = createEvent({
        eventId: 'evt-005',
        eventType: 'UnknownEvent',
      });

      await consumer.processEvent(event);

      expect(mockPayrollJobHandler.handle).not.toHaveBeenCalled();
      expect(mockTransactionHandler.handle).not.toHaveBeenCalled();
      expect(mockPayslipHandler.handle).not.toHaveBeenCalled();
    });
  });
});
