import { DataSource } from 'typeorm';
import { PayrollTransaction } from '../domain/payroll-transaction.entity';
import type { PayrollTransactionRepository } from '../domain/payroll-transaction.repository';
import type { ProcessedEventStore } from '../domain/processed-event-store';
import { EventAlreadyProcessedError } from '../domain/errors';

/**
 * Command to process a PayrollJobCreated event by creating per-employee
 * payroll transactions.
 *
 * Each employee in the payload gets a new PayrollTransaction created in
 * PENDING status, and the creation events are persisted to the outbox
 * within the same database transaction.
 *
 * Idempotency is enforced via the ProcessedEventStore — if this event
 * was already processed, the command returns the cached result.
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
 * Runs inside a TypeORM transaction that atomically persists:
 * 1. The processed-event record (idempotency)
 * 2. One PayrollTransaction per employee
 * 3. Outbox records for each PayrollTransactionCreated event
 */
export class ProcessPayrollJobHandler {
  constructor(
    private readonly dataSource: DataSource,
    private readonly transactionRepository: PayrollTransactionRepository,
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

      for (const employeeId of command.employeeIds) {
        // Create the domain aggregate
        const transaction = PayrollTransaction.create(
          command.companyId,
          command.jobId,
          employeeId,
          command.periodId,
        );

        // Pull events for outbox persistence
        const events = transaction.pullEvents();

        // Persist the transaction
        await manager.save('payroll_transactions', {
          id: transaction.id,
          companyId: transaction.companyId,
          jobId: transaction.jobId,
          employeeId: transaction.employeeId,
          periodId: transaction.periodId,
          status: transaction.status,
          grossPayCents: null,
          deductionsCents: null,
          netPayCents: null,
          currency: null,
          version: transaction.version,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Save domain event to outbox
        const domainEvent = events[0];
        if (domainEvent) {
          await manager.save('outbox', {
            id: domainEvent.eventId,
            eventType: domainEvent.eventType,
            aggregateId: domainEvent.aggregateId,
            payload: domainEvent.payload,
            createdAt: domainEvent.occurredAt,
            publishedAt: null,
          });
        }

        transactionIds.push(transaction.id);
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
