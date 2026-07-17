import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { PayrollTransaction } from '../domain/payroll-transaction.entity';
import type { PayrollTransactionRepository } from '../domain/payroll-transaction.repository';
import type { PayslipRepository } from '../domain/payslip.repository';
import type { PayrollCalculationService } from '../domain/payroll-calculation.service';
import type { ProcessedEventStore } from '../domain/processed-event-store';
import { Payslip } from '../domain/payslip.entity';
import { PayslipGeneratedEvent } from '../domain/events/payslip-generated.event';
import { EventAlreadyProcessedError } from '../domain/errors';
import { PayrollJobCompletedEvent } from '../domain/events/payroll-job-completed.event';

/**
 * Command to process a PayrollJobCreated event by creating per-employee
 * payroll transactions.
 *
 * For each employee in the payload:
 * 1. Creates a PayrollTransaction in PENDING status
 * 2. Processes the transaction immediately (stub calculation)
 * 3. Generates a payslip
 * 4. Persists all events to the outbox within the same ACID transaction
 *
 * After all employees are processed, emits a PayrollJobCompleted event.
 *
 * Idempotency is enforced via the ProcessedEventStore.
 */
export class ProcessPayrollJobCommand {
  constructor(
    public readonly eventId: string,
    public readonly jobId: string,
    public readonly companyId: string,
    public readonly periodId: string,
    public readonly employeeIds: string[],
  ) {}
}

/**
 * Result returned by the ProcessPayrollJobHandler.
 */
export interface ProcessPayrollJobResult {
  /** The job identifier that was processed. */
  readonly jobId: string;
  /** The created transaction IDs. */
  readonly transactionIds: string[];
}

/**
 * Handler for the ProcessPayrollJobCommand.
 *
 * Runs inside a single TypeORM transaction that atomically:
 * 1. Creates a PayrollTransaction per employee
 * 2. Processes each transaction (stub calculation)
 * 3. Generates a Payslip per completed transaction
 * 4. Persists all domain events to the outbox
 * 5. Emits PayrollJobCompleted
 * 6. Records the processed-event for idempotency
 */
export class ProcessPayrollJobHandler {
  constructor(
    private readonly dataSource: DataSource,
    private readonly transactionRepository: PayrollTransactionRepository,
    private readonly payslipRepository: PayslipRepository,
    private readonly calculationService: PayrollCalculationService,
    private readonly processedEventStore: ProcessedEventStore,
  ) {}

  /**
   * Executes the process-payroll-job command.
   *
   * @param command - The payroll job event details.
   * @returns The created transaction IDs.
   * @throws {EventAlreadyProcessedError} If this event was already processed.
   */
  async execute(
    command: ProcessPayrollJobCommand,
  ): Promise<ProcessPayrollJobResult> {
    // 1. Check idempotency
    const alreadyProcessed = await this.processedEventStore.isProcessed(
      command.eventId,
    );
    if (alreadyProcessed) {
      throw new EventAlreadyProcessedError(command.eventId);
    }

    // 2. Run the transactional write
    return this.dataSource.transaction(async (manager) => {
      const transactionIds: string[] = [];
      const allEvents: Array<{
        id: string;
        eventType: string;
        aggregateId: string;
        payload: unknown;
        createdAt: Date;
        publishedAt: null;
      }> = [];

      for (const employeeId of command.employeeIds) {
        // Create the domain aggregate in PENDING status
        const transaction = PayrollTransaction.create(
          command.companyId,
          command.jobId,
          employeeId,
          command.periodId,
        );

        // Pull creation events (PayrollTransactionCreated)
        const createEvents = transaction.pullEvents();

        // Process the transaction immediately (stub calculation)
        transaction.startProcessing();
        const result = this.calculationService.calculate(
          transaction.employeeId,
          transaction.periodId,
          transaction.companyId,
        );
        transaction.complete(result.grossPay, result.deductions, result.netPay);

        // Pull processing events (PayrollTransactionCompleted, etc.)
        const processEvents = transaction.pullEvents();

        // Create payslip
        const payslipId = randomUUID();
        const payslip = new Payslip(
          payslipId,
          transaction.id,
          transaction.jobId,
          transaction.employeeId,
          transaction.companyId,
          transaction.periodId,
          result.grossPay,
          result.deductions,
          result.netPay,
        );

        // Generate PayslipGenerated event
        const payslipEvent = new PayslipGeneratedEvent({
          payslipId: payslip.id,
          transactionId: payslip.transactionId,
          jobId: payslip.jobId,
          employeeId: payslip.employeeId,
          companyId: payslip.companyId,
          periodId: payslip.periodId,
          grossPayCents: payslip.grossPay.amount,
          deductionsCents: payslip.deductions.amount,
          netPayCents: payslip.netPay.amount,
          currency: payslip.grossPay.currency,
          timestamp: new Date().toISOString(),
        });

        // Persist the transaction with all fields (now completed)
        await manager.save('payroll_transactions', {
          id: transaction.id,
          companyId: transaction.companyId,
          jobId: transaction.jobId,
          employeeId: transaction.employeeId,
          periodId: transaction.periodId,
          status: transaction.status,
          grossPayCents: result.grossPay.amount,
          deductionsCents: result.deductions.amount,
          netPayCents: result.netPay.amount,
          currency: result.grossPay.currency,
          version: transaction.version + 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Persist payslip
        await manager.save('payslips', {
          id: payslip.id,
          transactionId: payslip.transactionId,
          jobId: payslip.jobId,
          employeeId: payslip.employeeId,
          companyId: payslip.companyId,
          periodId: payslip.periodId,
          grossPayCents: payslip.grossPay.amount,
          deductionsCents: payslip.deductions.amount,
          netPayCents: payslip.netPay.amount,
          currency: payslip.grossPay.currency,
          generatedAt: payslip.generatedAt,
        });

        // Collect all outbox events for this employee
        for (const event of [...createEvents, ...processEvents, payslipEvent]) {
          allEvents.push({
            id: event.eventId,
            eventType: event.eventType,
            aggregateId: event.aggregateId,
            payload: event.payload,
            createdAt: event.occurredAt,
            publishedAt: null,
          });
        }

        transactionIds.push(transaction.id);
      }

      // Emit PayrollJobCompleted event
      const completionEvent = new PayrollJobCompletedEvent({
        jobId: command.jobId,
        companyId: command.companyId,
        periodId: command.periodId,
        timestamp: new Date().toISOString(),
      });

      allEvents.push({
        id: completionEvent.eventId,
        eventType: completionEvent.eventType,
        aggregateId: completionEvent.aggregateId,
        payload: completionEvent.payload,
        createdAt: completionEvent.occurredAt,
        publishedAt: null,
      });

      // Persist ALL outbox events
      for (const outboxRecord of allEvents) {
        await manager.save('outbox', outboxRecord);
      }

      // Mark event as processed for idempotency
      await manager.save('processed_events', {
        eventId: command.eventId,
        processedAt: new Date(),
      });

      return {
        jobId: command.jobId,
        transactionIds,
      };
    });
  }
}
