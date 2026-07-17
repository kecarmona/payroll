import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEnvelope } from '@payroll/contracts';
import type { EventHandler } from '@payroll/event-bus';
import { IdempotencyService } from '../idempotency.service';
import { PayrollJobProjection } from '../../infrastructure/mongoose/payroll-job.schema';

/**
 * Payload expected in a PayrollJobCompleted integration event.
 */
export interface PayrollJobCompletedPayload {
  readonly jobId: string;
  readonly companyId: string;
  readonly periodId: string;
  readonly timestamp: string;
}

/**
 * Handler for PayrollJobCompleted events.
 *
 * Updates the PayrollJobProjection document status to COMPLETED in MongoDB.
 * The handler is idempotent — if the event was already processed, it is skipped.
 */
@Injectable()
export class PayrollJobCompletedHandler
  implements EventHandler<PayrollJobCompletedPayload>
{
  private readonly logger = new Logger(PayrollJobCompletedHandler.name);
  readonly eventType = 'PayrollJobCompleted';

  constructor(
    @InjectModel(PayrollJobProjection.name)
    private readonly jobModel: Model<PayrollJobProjection>,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  /**
   * Handles a PayrollJobCompleted event by setting the job status to COMPLETED.
   *
   * @param event - The deserialized event envelope containing job completion data.
   */
  async handle(
    event: EventEnvelope<PayrollJobCompletedPayload>,
  ): Promise<void> {
    const payload = event.payload;

    if (await this.idempotencyService.isProcessed(event.eventId)) {
      this.logger.debug(`Event ${event.eventId} already processed, skipping`);
      return;
    }

    const result = await this.jobModel.findOneAndUpdate(
      { jobId: payload.jobId },
      {
        $set: {
          status: 'COMPLETED',
          lastEventId: event.eventId,
        },
      },
      { new: true },
    );

    if (result) {
      this.logger.log(`Projected job ${payload.jobId} as COMPLETED`);
    } else {
      this.logger.warn(
        `Job ${payload.jobId} not found in projections for completion`,
      );
    }
  }
}
