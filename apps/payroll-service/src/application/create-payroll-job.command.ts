import { createHash } from 'crypto';
import { DataSource } from 'typeorm';
import { PayrollJob } from '../domain/payroll-job.entity';
import type { PayrollPeriodRepository } from '../domain/payroll-period.repository';
import type { PayrollJobRepository } from '../domain/payroll-job.repository';
import type { IdempotencyStore } from '../domain/idempotency-store';
import type { OutboxStore } from '../domain/outbox-store';
import {
  PayrollPeriodNotFoundError,
  DuplicatePayrollJobError,
} from './errors';

/**
 * Command to create a new payroll job for a company and period.
 */
export class CreatePayrollJobCommand {
  constructor(
    public readonly companyId: string,
    public readonly periodId: string,
    public readonly idempotencyKey: string,
    public readonly employeeIds: string[] = [],
  ) {}
}

/**
 * Result returned by the CreatePayrollJobHandler.
 */
export interface CreatePayrollJobResult {
  /** The newly created job ID. */
  readonly jobId: string;
  /** The job status after creation (always 'CREATED'). */
  readonly status: string;
}

/**
 * Handler for the CreatePayrollJobCommand.
 *
 * Runs inside a TypeORM transaction that atomically persists:
 * 1. The PayrollJob aggregate
 * 2. The outbox record (PayrollJobCreated event)
 * 3. The idempotency record
 *
 * Idempotency is checked before the transaction — if the key exists,
 * the cached response is returned without executing the command.
 */
export class CreatePayrollJobHandler {
  constructor(
    private readonly dataSource: DataSource,
    private readonly payrollPeriodRepository: PayrollPeriodRepository,
    private readonly payrollJobRepository: PayrollJobRepository,
    private readonly idempotencyStore: IdempotencyStore,
    private readonly outboxStore: OutboxStore,
  ) {}

  /**
   * Executes the create-payroll-job command.
   *
   * @param command - The job creation details including idempotency key.
   * @returns The job ID and status.
   * @throws {PayrollPeriodNotFoundError} If the period does not exist.
   * @throws {DuplicatePayrollJobError} If a job already exists for the company+period.
   */
  async execute(
    command: CreatePayrollJobCommand,
  ): Promise<CreatePayrollJobResult> {
    // 1. Check idempotency
    const existing = await this.idempotencyStore.findByKey(
      command.idempotencyKey,
    );
    if (existing) {
      return existing.responseBody as CreatePayrollJobResult;
    }

    // 2. Validate period exists
    const period = await this.payrollPeriodRepository.findById(
      command.periodId,
    );
    if (!period) {
      throw new PayrollPeriodNotFoundError(command.periodId);
    }

    // 3. Run the transactional write: aggregate + outbox + idempotency
    return this.dataSource.transaction(async (manager) => {
      // Check for duplicate job inside the transaction
      const existingJob = await this.payrollJobRepository.findByCompanyAndPeriod(
        command.companyId,
        command.periodId,
      );
      if (existingJob) {
        throw new DuplicatePayrollJobError(
          command.companyId,
          command.periodId,
        );
      }

      // Create domain aggregate
      const job = PayrollJob.create(command.companyId, command.periodId, command.employeeIds);
      const events = job.pullEvents();

      // Compute request hash for idempotency
      const requestHash = createHash('sha256')
        .update(JSON.stringify({ companyId: command.companyId, periodId: command.periodId }))
        .digest('hex');

      const responseBody: CreatePayrollJobResult = {
        jobId: job.id,
        status: 'CREATED',
      };

      // Persist within the same transaction
      await manager.save('payroll_jobs', {
        id: job.id,
        companyId: job.companyId,
        periodId: job.periodId,
        status: job.status.value,
        version: job.version,
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

      // Save idempotency record
      await manager.save('idempotency', {
        key: command.idempotencyKey,
        requestHash,
        responseStatus: 201,
        responseBody,
        createdAt: new Date(),
      });

      return responseBody;
    });
  }
}
