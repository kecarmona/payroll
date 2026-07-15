import { Injectable, Logger } from '@nestjs/common';
import { EventEnvelope } from '@payroll/contracts';
import { PayrollJobHandler } from '../../application/handlers/payroll-job.handler';
import { TransactionHandler } from '../../application/handlers/transaction.handler';
import { PayslipHandler } from '../../application/handlers/payslip.handler';

/**
 * In-memory event router for the projection service.
 *
 * Receives deserialized event envelopes and routes them to the appropriate
 * projection handler based on the event type. This replaces the Kafka consumer
 * for testability — the actual Kafka client integration is wired at the
 * module level.
 *
 * Supported event types:
 * - `PayrollJobCreated` → {@link PayrollJobHandler}
 * - `PayrollTransactionCompleted` → {@link TransactionHandler}
 * - `PayrollTransactionFailed` → {@link TransactionHandler}
 * - `PayslipGenerated` → {@link PayslipHandler}
 */
@Injectable()
export class ProjectionConsumerService {
  private readonly logger = new Logger(ProjectionConsumerService.name);

  constructor(
    private readonly payrollJobHandler: PayrollJobHandler,
    private readonly transactionHandler: TransactionHandler,
    private readonly payslipHandler: PayslipHandler,
  ) {}

  /**
   * Routes an event to the appropriate handler based on its event type.
   *
   * @param event - The deserialized event envelope.
   */
  async processEvent(event: EventEnvelope): Promise<void> {
    switch (event.eventType) {
      case 'PayrollJobCreated':
        await this.payrollJobHandler.handle(event as never);
        break;

      case 'PayrollTransactionCompleted':
      case 'PayrollTransactionFailed':
        await this.transactionHandler.handle(event);
        break;

      case 'PayslipGenerated':
        await this.payslipHandler.handle(event as never);
        break;

      default:
        this.logger.warn(`No handler for event type: ${event.eventType}`);
    }
  }
}
