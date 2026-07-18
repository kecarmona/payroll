import { EventEnvelope } from '@payroll/contracts';
import { PayslipHandler, PayslipGeneratedPayload } from './payslip.handler';
import { IdempotencyService } from '../idempotency.service';

describe('PayslipHandler', () => {
  let handler: PayslipHandler;
  let mockPayslipModel: { findOneAndUpdate: jest.Mock };
  let mockIdempotency: { isProcessed: jest.Mock };

  beforeEach(() => {
    mockPayslipModel = {
      findOneAndUpdate: jest.fn(),
    };

    mockIdempotency = {
      isProcessed: jest.fn(),
    };

    handler = new PayslipHandler(
      mockPayslipModel as never,
      mockIdempotency as unknown as IdempotencyService,
    );
  });

  describe('handle PayslipGenerated', () => {
    const payslipEvent: EventEnvelope<PayslipGeneratedPayload> = {
      eventId: 'evt-ps-001',
      eventType: 'PayslipGenerated',
      version: 1,
      timestamp: '2026-07-15T10:00:00.000Z',
      companyId: 'comp-001',
      correlationId: 'corr-001',
      causationId: 'caus-001',
      producer: 'payroll-processing-service',
      payload: {
        payslipId: 'ps-001',
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

    it('should upsert a PayslipProjection document', async () => {
      mockIdempotency.isProcessed.mockResolvedValue(false);
      mockPayslipModel.findOneAndUpdate.mockResolvedValue({ payslipId: 'ps-001' });

      await handler.handle(payslipEvent);

      expect(mockIdempotency.isProcessed).toHaveBeenCalledWith('evt-ps-001');
      expect(mockPayslipModel.findOneAndUpdate).toHaveBeenCalledWith(
        { payslipId: 'ps-001' },
        {
          $set: {
            payslipId: 'ps-001',
            transactionId: 'tx-001',
            jobId: 'job-001',
            employeeId: 'emp-001',
            companyId: 'comp-001',
            periodId: 'period-001',
            grossPay: 500000,
            deductions: 100000,
            netPay: 400000,
            generatedAt: '2026-07-15T10:00:00.000Z',
            lastEventId: 'evt-ps-001',
          },
        },
        { upsert: true, new: true },
      );
    });

    it('should skip upsert when event was already processed', async () => {
      mockIdempotency.isProcessed.mockResolvedValue(true);

      await handler.handle(payslipEvent);

      expect(mockPayslipModel.findOneAndUpdate).not.toHaveBeenCalled();
    });
  });
});
