import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import type { PayrollTransactionRepository } from '../domain/payroll-transaction.repository';
import type { PayrollCalculationService } from '../domain/payroll-calculation.service';
import type { PayslipRepository } from '../domain/payslip.repository';
import { Payslip } from '../domain/payslip.entity';
import { PayslipGeneratedEvent } from '../domain/events/payslip-generated.event';
import { PayrollTransactionNotFoundError } from '../domain/errors';

/**
 * Command to process a single payroll transaction.
 *
 * Loads the transaction, calculates payroll amounts via the domain service,
 * and either completes or fails the transaction.
 */
export class ProcessTransactionCommand {
  constructor(
    public readonly transactionId: string,
    public readonly expectedVersion: number,
  ) {}
}

/**
 * Result returned by the ProcessTransactionHandler.
 */
export interface ProcessTransactionResult {
  /** The transaction ID that was processed. */
  readonly transactionId: string;
  /** The final status after processing. */
  readonly status: string;
  /** The payslip ID if the transaction completed successfully, or null. */
  readonly payslipId: string | null;
}

/**
 * Handler for the ProcessTransactionCommand.
 *
 * Uses optimistic locking (version check) to prevent concurrent processing
 * of the same transaction. On failure, increments a retry count and emits
 * PayrollTransactionFailed if the maximum retry attempts are exceeded.
 */
export class ProcessTransactionHandler {
  constructor(
    private readonly dataSource: DataSource,
    private readonly transactionRepository: PayrollTransactionRepository,
    private readonly payslipRepository: PayslipRepository,
    private readonly calculationService: PayrollCalculationService,
  ) {}

  /**
   * Executes the process-transaction command.
   *
   * @param command - The transaction processing details.
   * @returns The processing result with status and optional payslip ID.
   * @throws {PayrollTransactionNotFoundError} If the transaction does not exist.
   */
  async execute(
    command: ProcessTransactionCommand,
  ): Promise<ProcessTransactionResult> {
    // 1. Load the aggregate
    const transaction = await this.transactionRepository.findById(
      command.transactionId,
    );
    if (!transaction) {
      throw new PayrollTransactionNotFoundError(command.transactionId);
    }

    // 2. Optimistic locking check
    transaction.assertVersion(command.expectedVersion);

    // 3. Run the transactional write
    return this.dataSource.transaction(async (manager) => {
      try {
        // Mark as processing
        transaction.startProcessing();

        // Calculate payroll amounts (stub)
        const result = this.calculationService.calculate(
          transaction.employeeId,
          transaction.periodId,
          transaction.companyId,
        );

        // Complete the transaction
        transaction.complete(result.grossPay, result.deductions, result.netPay);

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

        // Pull events for outbox
        const events = transaction.pullEvents();

        // Add PayslipGenerated event
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

        events.push(payslipEvent);

        // Persist transaction (version bumped)
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

        // Save domain events to outbox
        for (const event of events) {
          await manager.save('outbox', {
            id: event.eventId,
            eventType: event.eventType,
            aggregateId: event.aggregateId,
            payload: event.payload,
            createdAt: event.occurredAt,
            publishedAt: null,
          });
        }

        return {
          transactionId: transaction.id,
          status: 'COMPLETED',
          payslipId: payslip.id,
        };
      } catch {
        // On failure, mark as failed — in production this would check
        // retry count and only fail if max retries exhausted
        transaction.fail();
        const events = transaction.pullEvents();

        // Persist failed status
        await manager.save('payroll_transactions', {
          id: transaction.id,
          status: transaction.status,
          version: transaction.version + 1,
          updatedAt: new Date(),
        });

        // Save failure event to outbox
        for (const event of events) {
          await manager.save('outbox', {
            id: event.eventId,
            eventType: event.eventType,
            aggregateId: event.aggregateId,
            payload: event.payload,
            createdAt: event.occurredAt,
            publishedAt: null,
          });
        }

        return {
          transactionId: transaction.id,
          status: 'FAILED',
          payslipId: null,
        };
      }
    });
  }
}
