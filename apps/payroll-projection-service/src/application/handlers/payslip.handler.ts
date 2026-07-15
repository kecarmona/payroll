import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEnvelope } from '@payroll/contracts';
import type { EventHandler } from '@payroll/event-bus';
import { IdempotencyService } from '../idempotency.service';
import { PayslipProjection } from '../../infrastructure/mongoose/payslip.schema';

/**
 * Payload for PayslipGenerated events.
 */
export interface PayslipGeneratedPayload {
  readonly payslipId: string;
  readonly transactionId: string;
  readonly jobId: string;
  readonly employeeId: string;
  readonly companyId: string;
  readonly periodId: string;
  readonly grossPayCents: number;
  readonly deductionsCents: number;
  readonly netPayCents: number;
  readonly currency: string;
  readonly timestamp: string;
}

/**
 * Handler for PayslipGenerated events.
 *
 * Creates or updates a PayslipProjection document in MongoDB.
 * The handler is idempotent — if the event was already processed, it is skipped.
 */
@Injectable()
export class PayslipHandler implements EventHandler<PayslipGeneratedPayload> {
  private readonly logger = new Logger(PayslipHandler.name);
  readonly eventType = 'PayslipGenerated';

  constructor(
    @InjectModel(PayslipProjection.name)
    private readonly payslipModel: Model<PayslipProjection>,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  /**
   * Handles a PayslipGenerated event by upserting the payslip projection.
   *
   * @param event - The deserialized event envelope containing payslip data.
   */
  async handle(event: EventEnvelope<PayslipGeneratedPayload>): Promise<void> {
    const payload = event.payload;

    if (await this.idempotencyService.isProcessed(event.eventId)) {
      this.logger.debug(`Event ${event.eventId} already processed, skipping`);
      return;
    }

    await this.payslipModel.findOneAndUpdate(
      { payslipId: payload.payslipId },
      {
        $set: {
          payslipId: payload.payslipId,
          transactionId: payload.transactionId,
          jobId: payload.jobId,
          employeeId: payload.employeeId,
          companyId: payload.companyId,
          periodId: payload.periodId,
          grossPay: payload.grossPayCents,
          deductions: payload.deductionsCents,
          netPay: payload.netPayCents,
          generatedAt: payload.timestamp,
          lastEventId: event.eventId,
        },
      },
      { upsert: true, new: true },
    );

    this.logger.log(
      `Projected payslip ${payload.payslipId} for employee ${payload.employeeId} (job ${payload.jobId})`,
    );
  }
}
