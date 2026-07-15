import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PayrollJobProjection } from '../infrastructure/mongoose/payroll-job.schema';
import { PayrollTransactionProjection } from '../infrastructure/mongoose/payroll-transaction.schema';
import { PayslipProjection } from '../infrastructure/mongoose/payslip.schema';

/**
 * Service that provides idempotency checks across the three projection collections.
 *
 * Each incoming event carries a unique `eventId`. Before processing an event,
 * the service checks whether that `lastEventId` already exists in any of the
 * projection collections (jobs, transactions, payslips). If found, the event
 * has already been projected and processing is skipped.
 *
 * This guarantees at-most-once semantics for the projection service.
 */
@Injectable()
export class IdempotencyService {
  constructor(
    @InjectModel(PayrollJobProjection.name)
    private readonly jobModel: Model<PayrollJobProjection>,

    @InjectModel(PayrollTransactionProjection.name)
    private readonly transactionModel: Model<PayrollTransactionProjection>,

    @InjectModel(PayslipProjection.name)
    private readonly payslipModel: Model<PayslipProjection>,
  ) {}

  /**
   * Checks whether an event has already been processed by looking up its
   * `eventId` in the `lastEventId` field of all three projection collections.
   *
   * @param eventId - The unique identifier of the event to check.
   * @returns `true` if the event was found in any collection, `false` otherwise.
   */
  async isProcessed(eventId: string): Promise<boolean> {
    if (await this.jobModel.exists({ lastEventId: eventId })) {
      return true;
    }
    if (await this.transactionModel.exists({ lastEventId: eventId })) {
      return true;
    }
    if (await this.payslipModel.exists({ lastEventId: eventId })) {
      return true;
    }
    return false;
  }
}
