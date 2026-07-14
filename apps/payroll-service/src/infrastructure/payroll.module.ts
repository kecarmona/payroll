import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmPayrollPeriodEntity } from './persistence/typeorm-payroll-period.entity';
import { TypeOrmPayrollJobEntity } from './persistence/typeorm-payroll-job.entity';
import { TypeOrmIdempotencyEntity } from './persistence/typeorm-idempotency.entity';
import { TypeOrmOutboxEntity } from './persistence/typeorm-outbox.entity';
import { TypeOrmPayrollPeriodRepository } from './persistence/typeorm-payroll-period.repository';
import { TypeOrmPayrollJobRepository } from './persistence/typeorm-payroll-job.repository';
import { TypeOrmIdempotencyRepository } from './persistence/typeorm-idempotency.repository';
import { TypeOrmOutboxRepository } from './persistence/typeorm-outbox.repository';

/**
 * Injection tokens for domain port implementations.
 *
 * These string tokens enable NestJS DI to resolve domain port interfaces
 * that are erased at runtime (TypeScript interfaces). Application-layer
 * handlers use `@Inject(token)` to receive the concrete implementation.
 *
 * @example
 * ```ts
 * class CreatePayrollPeriodHandler {
 *   constructor(
 *     @Inject('PayrollPeriodRepository')
 *     private readonly payrollPeriodRepository: PayrollPeriodRepository,
 *   ) {}
 * }
 * ```
 */
export const PAYROLL_PERIOD_REPOSITORY_TOKEN = 'PayrollPeriodRepository';
export const PAYROLL_JOB_REPOSITORY_TOKEN = 'PayrollJobRepository';
export const IDEMPOTENCY_STORE_TOKEN = 'IdempotencyStore';
export const OUTBOX_STORE_TOKEN = 'OutboxStore';

/**
 * NestJS module that wires the infrastructure layer for the Payroll Service.
 *
 * ## Provided Bindings
 *
 * | Token | Implementation | Domain Port |
 * |---|---|---|
 * | `'PayrollPeriodRepository'` | {@link TypeOrmPayrollPeriodRepository} | {@link PayrollPeriodRepository} |
 * | `'PayrollJobRepository'` | {@link TypeOrmPayrollJobRepository} | {@link PayrollJobRepository} |
 * | `'IdempotencyStore'` | {@link TypeOrmIdempotencyRepository} | {@link IdempotencyStore} |
 * | `'OutboxStore'` | {@link TypeOrmOutboxRepository} | {@link OutboxStore} |
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      TypeOrmPayrollPeriodEntity,
      TypeOrmPayrollJobEntity,
      TypeOrmIdempotencyEntity,
      TypeOrmOutboxEntity,
    ]),
  ],
  providers: [
    {
      provide: PAYROLL_PERIOD_REPOSITORY_TOKEN,
      useClass: TypeOrmPayrollPeriodRepository,
    },
    {
      provide: PAYROLL_JOB_REPOSITORY_TOKEN,
      useClass: TypeOrmPayrollJobRepository,
    },
    {
      provide: IDEMPOTENCY_STORE_TOKEN,
      useClass: TypeOrmIdempotencyRepository,
    },
    {
      provide: OUTBOX_STORE_TOKEN,
      useClass: TypeOrmOutboxRepository,
    },
  ],
  exports: [
    PAYROLL_PERIOD_REPOSITORY_TOKEN,
    PAYROLL_JOB_REPOSITORY_TOKEN,
    IDEMPOTENCY_STORE_TOKEN,
    OUTBOX_STORE_TOKEN,
  ],
})
export class PayrollModule {}
