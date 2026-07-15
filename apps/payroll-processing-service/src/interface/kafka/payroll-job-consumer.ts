import { Injectable, Logger } from '@nestjs/common';
import { PayrollEventType } from '@payroll/contracts';
import type { EventEnvelope } from '@payroll/contracts';
import type { EventHandler } from '@payroll/event-bus';
import { ProcessPayrollJobHandler, ProcessPayrollJobCommand } from '../../application/process-payroll-job.command';

/**
 * Payload shape for a PayrollJobCreated integration event.
 *
 * Matches the contract defined in the payroll-service producer.
 */
interface PayrollJobCreatedPayload {
  readonly jobId: string;
  readonly companyId: string;
  readonly periodId: string;
  readonly employeeIds?: string[];
  readonly timestamp: string;
}

/**
 * Handles PayrollJobCreated events from Kafka.
 *
 * When a payroll job is created, this consumer extracts the job details
 * and employee list, then delegates to the ProcessPayrollJobHandler to
 * create per-employee transactions.
 */
@Injectable()
export class PayrollJobConsumer implements EventHandler<PayrollJobCreatedPayload> {
  private readonly logger = new Logger(PayrollJobConsumer.name);
  readonly eventType: string = PayrollEventType.PayrollJobCreated;

  constructor(
    private readonly handler: ProcessPayrollJobHandler,
  ) {}

  /**
   * Handles a PayrollJobCreated event.
   *
   * Creates PayrollTransaction aggregates for each employee in the job.
   *
   * @param event - The deserialized event envelope.
   */
  async handle(event: EventEnvelope<PayrollJobCreatedPayload>): Promise<void> {
    const { jobId, companyId, periodId, employeeIds } = event.payload;

    this.logger.log(
      `Processing PayrollJobCreated event for job ${jobId} (${employeeIds?.length ?? 0} employees)`,
    );

    const command = new ProcessPayrollJobCommand(
      event.eventId,
      jobId,
      companyId,
      periodId,
      employeeIds ?? [],
    );

    const result = await this.handler.execute(command);

    this.logger.log(
      `Created ${result.transactionIds.length} transactions for job ${jobId}`,
    );
  }
}
