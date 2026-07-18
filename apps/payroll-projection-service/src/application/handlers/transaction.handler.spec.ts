import { EventEnvelope } from '@payroll/contracts';
import { TransactionHandler } from './transaction.handler';
import { IdempotencyService } from '../idempotency.service';

describe('TransactionHandler', () => {
  let handler: TransactionHandler;
  let mockTransactionModel: { findOneAndUpdate: jest.Mock };
  let mockJobModel: { findOneAndUpdate: jest.Mock; findOne: jest.Mock };
  let mockIdempotency: { isProcessed: jest.Mock };

  beforeEach(() => {
    mockTransactionModel = {
      findOneAndUpdate: jest.fn(),
    };

    mockJobModel = {
      findOneAndUpdate: jest.fn(),
      findOne: jest.fn(),
    };

    mockIdempotency = {
      isProcessed: jest.fn(),
    };

    handler = new TransactionHandler(
      mockTransactionModel as never,
      mockJobModel as never,
      mockIdempotency as unknown as IdempotencyService,
    );
  });

  describe('handle PayrollTransactionCompleted', () => {
    const completedEvent: EventEnvelope = {
      eventId: 'evt-tx-001',
      eventType: 'PayrollTransactionCompleted',
      version: 1,
      timestamp: '2026-07-15T10:00:00.000Z',
      companyId: 'comp-001',
      correlationId: 'corr-001',
      causationId: 'caus-001',
      producer: 'payroll-processing-service',
      payload: {
        transactionId: 'tx-001',
        jobId: 'job-001',
        employeeId: 'emp-001',
        companyId: 'comp-001',
        periodId: 'period-001',
        grossPayCents: 500000,
        deductionsCents: 100000,
        netPayCents: 400000,
        currency: 'USD',
        timestamp: '2026-07-15T10:00:00.000Z',
      },
    };

    it('should upsert a completed transaction projection', async () => {
      mockIdempotency.isProcessed.mockResolvedValue(false);
      mockTransactionModel.findOneAndUpdate.mockResolvedValue({ transactionId: 'tx-001' });
      mockJobModel.findOneAndUpdate.mockResolvedValue({});

      await handler.handle(completedEvent);

      expect(mockIdempotency.isProcessed).toHaveBeenCalledWith('evt-tx-001');
      expect(mockTransactionModel.findOneAndUpdate).toHaveBeenCalledWith(
        { transactionId: 'tx-001' },
        {
          $set: {
            transactionId: 'tx-001',
            jobId: 'job-001',
            employeeId: 'emp-001',
            companyId: 'comp-001',
            periodId: 'period-001',
            status: 'COMPLETED',
            grossPay: 500000,
            deductions: 100000,
            netPay: 400000,
            lastEventId: 'evt-tx-001',
          },
        },
        { upsert: true, new: true },
      );
    });

    it('should increment processedCount on the parent job', async () => {
      mockIdempotency.isProcessed.mockResolvedValue(false);
      mockTransactionModel.findOneAndUpdate.mockResolvedValue({ transactionId: 'tx-001' });
      mockJobModel.findOneAndUpdate.mockResolvedValue({});

      await handler.handle(completedEvent);

      expect(mockJobModel.findOneAndUpdate).toHaveBeenCalledWith(
        { jobId: 'job-001' },
        { $inc: { processedCount: 1 } },
      );
    });

    it('should skip processing when event was already handled', async () => {
      mockIdempotency.isProcessed.mockResolvedValue(true);

      await handler.handle(completedEvent);

      expect(mockTransactionModel.findOneAndUpdate).not.toHaveBeenCalled();
      expect(mockJobModel.findOneAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('handle PayrollTransactionFailed', () => {
    const failedEvent: EventEnvelope = {
      eventId: 'evt-tx-002',
      eventType: 'PayrollTransactionFailed',
      version: 1,
      timestamp: '2026-07-15T10:00:00.000Z',
      companyId: 'comp-001',
      correlationId: 'corr-002',
      causationId: 'caus-002',
      producer: 'payroll-processing-service',
      payload: {
        transactionId: 'tx-002',
        jobId: 'job-001',
        employeeId: 'emp-002',
        companyId: 'comp-001',
        periodId: 'period-001',
        reason: 'Calculation error',
        timestamp: '2026-07-15T10:00:00.000Z',
      },
    };

    it('should upsert a failed transaction projection', async () => {
      mockIdempotency.isProcessed.mockResolvedValue(false);
      mockTransactionModel.findOneAndUpdate.mockResolvedValue({ transactionId: 'tx-002' });
      mockJobModel.findOneAndUpdate.mockResolvedValue({});

      await handler.handle(failedEvent);

      expect(mockTransactionModel.findOneAndUpdate).toHaveBeenCalledWith(
        { transactionId: 'tx-002' },
        {
          $set: {
            transactionId: 'tx-002',
            jobId: 'job-001',
            employeeId: 'emp-002',
            companyId: 'comp-001',
            periodId: 'period-001',
            status: 'FAILED',
            lastEventId: 'evt-tx-002',
          },
        },
        { upsert: true, new: true },
      );
    });

    it('should increment failedCount on the parent job', async () => {
      mockIdempotency.isProcessed.mockResolvedValue(false);
      mockTransactionModel.findOneAndUpdate.mockResolvedValue({ transactionId: 'tx-002' });
      mockJobModel.findOneAndUpdate.mockResolvedValue({});

      await handler.handle(failedEvent);

      expect(mockJobModel.findOneAndUpdate).toHaveBeenCalledWith(
        { jobId: 'job-001' },
        { $inc: { failedCount: 1 } },
      );
    });
  });
});
