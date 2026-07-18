import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEnvelope } from '@payroll/contracts';
import type { EventHandler } from '@payroll/event-bus';
import { IdempotencyService } from '../idempotency.service';
import { PayrollJobProjection } from '../../infrastructure/mongoose/payroll-job.schema';

/**
 * Payload expected in a PayrollJobCreated integration event.
 */
export interface PayrollJobCreatedPayload {
  readonly jobId: string;
  readonly companyId: string;
  readonly periodId: string;
  readonly employeeIds?: string[];
  readonly timestamp: string;
}

/**
 * Handler for PayrollJobCreated events.
 *
 * Creates or updates a PayrollJobProjection document in MongoDB.
 * The handler is idempotent — if the event was already processed, it is skipped.
 */
@Injectable()
export class PayrollJobHandler implements EventHandler<PayrollJobCreatedPayload> {
  private readonly logger = new Logger(PayrollJobHandler.name);
  readonly eventType = 'PayrollJobCreated';

  constructor(
    @InjectModel(PayrollJobProjection.name)
    private readonly jobModel: Model<PayrollJobProjection>,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  /**
   * Handles a PayrollJobCreated event by upserting the job projection.
   *
   * @param event - The deserialized event envelope containing job creation data.
   */
  async handle(event: EventEnvelope<PayrollJobCreatedPayload>): Promise<void> {
    const payload = event.payload;

    if (await this.idempotencyService.isProcessed(event.eventId)) {
      this.logger.debug(`Event ${event.eventId} already processed, skipping`);
      return;
    }

    const employeeIds = payload.employeeIds ?? [];

    await this.jobModel.findOneAndUpdate(
      { jobId: payload.jobId },
      {
        $set: {
          jobId: payload.jobId,
          companyId: payload.companyId,
          periodId: payload.periodId,
          status: 'CREATED',
          totalEmployees: employeeIds.length,
          lastEventId: event.eventId,
        },
        $setOnInsert: {
          processedCount: 0,
          failedCount: 0,
        },
      },
      { upsert: true, new: true },
    );

    this.logger.log(
      `Projected job ${payload.jobId} for company ${payload.companyId} (${employeeIds.length} employees)`,
    );
  }
}
