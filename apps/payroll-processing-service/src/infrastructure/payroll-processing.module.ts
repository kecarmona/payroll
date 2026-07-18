import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmPayrollTransactionEntity } from './persistence/typeorm-payroll-transaction.entity';
import { TypeOrmPayslipEntity } from './persistence/typeorm-payslip.entity';
import { TypeOrmProcessedEventEntity } from './persistence/typeorm-processed-event.entity';
import { TypeOrmPayrollTransactionRepository } from './persistence/typeorm-payroll-transaction.repository';
import { TypeOrmPayslipRepository } from './persistence/typeorm-payslip.repository';
import { TypeOrmProcessedEventRepository } from './persistence/typeorm-processed-event.repository';
import { StubPayrollCalculationService } from './stub-payroll-calculation.service';

/**
 * Injection tokens for domain port implementations.
 *
 * These string tokens enable NestJS DI to resolve domain port interfaces
 * that are erased at runtime (TypeScript interfaces).
 */
export const PAYROLL_TRANSACTION_REPOSITORY_TOKEN = 'PayrollTransactionRepository';
export const PAYSLIP_REPOSITORY_TOKEN = 'PayslipRepository';
export const PROCESSED_EVENT_STORE_TOKEN = 'ProcessedEventStore';
export const PAYROLL_CALCULATION_SERVICE_TOKEN = 'PayrollCalculationService';

/**
 * NestJS module that wires the infrastructure layer for the
 * Payroll Processing Service.
 *
 * ## Provided Bindings
 *
 * | Token | Implementation | Domain Port |
 * |---|---|---|
 * | `'PayrollTransactionRepository'` | {@link TypeOrmPayrollTransactionRepository} | {@link PayrollTransactionRepository} |
 * | `'PayslipRepository'` | {@link TypeOrmPayslipRepository} | {@link PayslipRepository} |
 * | `'ProcessedEventStore'` | {@link TypeOrmProcessedEventRepository} | {@link ProcessedEventStore} |
 * | `'PayrollCalculationService'` | {@link StubPayrollCalculationService} | {@link PayrollCalculationService} |
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      TypeOrmPayrollTransactionEntity,
      TypeOrmPayslipEntity,
      TypeOrmProcessedEventEntity,
    ]),
  ],
  providers: [
    {
      provide: PAYROLL_TRANSACTION_REPOSITORY_TOKEN,
      useClass: TypeOrmPayrollTransactionRepository,
    },
    {
      provide: PAYSLIP_REPOSITORY_TOKEN,
      useClass: TypeOrmPayslipRepository,
    },
    {
      provide: PROCESSED_EVENT_STORE_TOKEN,
      useClass: TypeOrmProcessedEventRepository,
    },
    {
      provide: PAYROLL_CALCULATION_SERVICE_TOKEN,
      useClass: StubPayrollCalculationService,
    },
  ],
  exports: [
    PAYROLL_TRANSACTION_REPOSITORY_TOKEN,
    PAYSLIP_REPOSITORY_TOKEN,
    PROCESSED_EVENT_STORE_TOKEN,
    PAYROLL_CALCULATION_SERVICE_TOKEN,
  ],
})
export class PayrollProcessingModule {}
