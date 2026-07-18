import { Model } from 'mongoose';
import { EventEnvelope } from '@payroll/contracts';
import { PayrollJobHandler, PayrollJobCreatedPayload } from './payroll-job.handler';
import { IdempotencyService } from '../idempotency.service';
import { PayrollJobProjection } from '../../infrastructure/mongoose/payroll-job.schema';

describe('PayrollJobHandler', () => {
  let handler: PayrollJobHandler;
  let mockJobModel: jest.Mocked<Pick<Model<PayrollJobProjection>, 'findOneAndUpdate'>>;
  let mockIdempotency: { isProcessed: jest.Mock };

  beforeEach(() => {
    mockJobModel = {
      findOneAndUpdate: jest.fn(),
    };

    mockIdempotency = {
      isProcessed: jest.fn(),
    };

    handler = new PayrollJobHandler(
      mockJobModel as unknown as Model<PayrollJobProjection>,
      mockIdempotency as unknown as IdempotencyService,
    );
  });

  describe('handle PayrollJobCreated', () => {
    const jobCreatedEvent: EventEnvelope<PayrollJobCreatedPayload> = {
      eventId: 'evt-job-001',
      eventType: 'PayrollJobCreated',
      version: 1,
      timestamp: '2026-07-15T10:00:00.000Z',
      companyId: 'comp-001',
      correlationId: 'corr-001',
      causationId: 'caus-001',
      producer: 'payroll-service',
      payload: {
        jobId: 'job-001',
        companyId: 'comp-001',
        periodId: 'period-001',
        employeeIds: ['emp-001', 'emp-002'],
        timestamp: '2026-07-15T10:00:00.000Z',
      },
    };

    it('should upsert a PayrollJobProjection document', async () => {
      mockIdempotency.isProcessed.mockResolvedValue(false);
      mockJobModel.findOneAndUpdate.mockResolvedValue({
        jobId: 'job-001',
      } as never);

      await handler.handle(jobCreatedEvent);

      expect(mockIdempotency.isProcessed).toHaveBeenCalledWith('evt-job-001');
      expect(mockJobModel.findOneAndUpdate).toHaveBeenCalledWith(
        { jobId: 'job-001' },
        {
          $set: {
            jobId: 'job-001',
            companyId: 'comp-001',
            periodId: 'period-001',
            status: 'CREATED',
            totalEmployees: 2,
            lastEventId: 'evt-job-001',
          },
          $setOnInsert: {
            processedCount: 0,
            failedCount: 0,
          },
        },
        { upsert: true, new: true },
      );
    });

    it('should skip upsert when event was already processed', async () => {
      mockIdempotency.isProcessed.mockResolvedValue(true);

      await handler.handle(jobCreatedEvent);

      expect(mockJobModel.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('should handle events without employeeIds', async () => {
      const eventNoEmployees: EventEnvelope<PayrollJobCreatedPayload> = {
        ...jobCreatedEvent,
        eventId: 'evt-job-002',
        payload: {
          jobId: 'job-002',
          companyId: 'comp-001',
          periodId: 'period-001',
          timestamp: '2026-07-15T10:00:00.000Z',
        },
      };

      mockIdempotency.isProcessed.mockResolvedValue(false);
      mockJobModel.findOneAndUpdate.mockResolvedValue({
        jobId: 'job-002',
      } as never);

      await handler.handle(eventNoEmployees);

      expect(mockJobModel.findOneAndUpdate).toHaveBeenCalledWith(
        { jobId: 'job-002' },
        expect.objectContaining({
          $set: expect.objectContaining({
            totalEmployees: 0,
          }),
        }),
        { upsert: true, new: true },
      );
    });
  });
});
