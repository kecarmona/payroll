import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEnvelope } from '@payroll/contracts';
import type { EventHandler } from '@payroll/event-bus';
import { IdempotencyService } from '../idempotency.service';
import { PayrollTransactionProjection } from '../../infrastructure/mongoose/payroll-transaction.schema';
import { PayrollJobProjection } from '../../infrastructure/mongoose/payroll-job.schema';

/**
 * Payload for PayrollTransactionCompleted events.
 */
interface TransactionCompletedPayload {
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
 * Payload for PayrollTransactionFailed events.
 */
interface TransactionFailedPayload {
  readonly transactionId: string;
  readonly jobId: string;
  readonly employeeId: string;
  readonly companyId: string;
  readonly periodId: string;
  readonly reason: string;
  readonly timestamp: string;
}

/**
 * Handler for PayrollTransactionCompleted and PayrollTransactionFailed events.
 *
 * For each event, the handler:
 * 1. Checks idempotency (skips if already processed)
 * 2. Upserts the transaction projection document
 * 3. Increments the parent job's processedCount or failedCount
 */
@Injectable()
export class TransactionHandler implements EventHandler {
  private readonly logger = new Logger(TransactionHandler.name);
  /**
   * This handler accepts both event types. The eventType property is not
   * used for single-type routing — the Kafka consumer routes by eventType
   * and calls handle() directly.
   */
  readonly eventType = 'PayrollTransactionCompleted';

  constructor(
    @InjectModel(PayrollTransactionProjection.name)
    private readonly transactionModel: Model<PayrollTransactionProjection>,
    @InjectModel(PayrollJobProjection.name)
    private readonly jobModel: Model<PayrollJobProjection>,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  /**
   * Handles a transaction event by upserting the projection and updating
   * the parent job's aggregate counters.
   *
   * @param event - The deserialized event envelope.
   */
  async handle(event: EventEnvelope): Promise<void> {
    if (await this.idempotencyService.isProcessed(event.eventId)) {
      this.logger.debug(`Event ${event.eventId} already processed, skipping`);
      return;
    }

    const payload = event.payload as Record<string, unknown>;
    const jobId = payload['jobId'] as string;

    if (event.eventType === 'PayrollTransactionCompleted') {
      await this.handleCompleted(event, payload);
    } else if (event.eventType === 'PayrollTransactionFailed') {
      await this.handleFailed(event, payload);
    }

    if (jobId) {
      this.logger.log(
        `Projected ${event.eventType} for transaction ${payload['transactionId']} (job ${jobId})`,
      );
    }
  }

  /**
   * Upserts a completed transaction and increments the job's processedCount.
   */
  private async handleCompleted(
    event: EventEnvelope,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const data = payload as unknown as TransactionCompletedPayload;

    await this.transactionModel.findOneAndUpdate(
      { transactionId: data.transactionId },
      {
        $set: {
          transactionId: data.transactionId,
          jobId: data.jobId,
          employeeId: data.employeeId,
          companyId: data.companyId,
          periodId: data.periodId,
          status: 'COMPLETED',
          grossPay: data.grossPayCents,
          deductions: data.deductionsCents,
          netPay: data.netPayCents,
          lastEventId: event.eventId,
        },
      },
      { upsert: true, new: true },
    );

    await this.jobModel.findOneAndUpdate(
      { jobId: data.jobId },
      { $inc: { processedCount: 1 } },
    );
  }

  /**
   * Upserts a failed transaction and increments the job's failedCount.
   */
  private async handleFailed(
    event: EventEnvelope,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const data = payload as unknown as TransactionFailedPayload;

    await this.transactionModel.findOneAndUpdate(
      { transactionId: data.transactionId },
      {
        $set: {
          transactionId: data.transactionId,
          jobId: data.jobId,
          employeeId: data.employeeId,
          companyId: data.companyId,
          periodId: data.periodId,
          status: 'FAILED',
          lastEventId: event.eventId,
        },
      },
      { upsert: true, new: true },
    );

    await this.jobModel.findOneAndUpdate(
      { jobId: data.jobId },
      { $inc: { failedCount: 1 } },
    );
  }
}
