import { Module } from '@nestjs/common';
import { ProjectionMongooseModule } from '../infrastructure/mongoose/projection-mongoose.module';
import { IdempotencyService } from './idempotency.service';
import { PayrollJobHandler } from './handlers/payroll-job.handler';
import { PayrollJobCompletedHandler } from './handlers/payroll-job-completed.handler';
import { TransactionHandler } from './handlers/transaction.handler';
import { PayslipHandler } from './handlers/payslip.handler';

/**
 * NestJS module that wires the application layer of the projection service.
 *
 * Provides:
 * - {@link IdempotencyService} — idempotency checks across projection collections
 * - {@link PayrollJobHandler} — handles PayrollJobCreated events
 * - {@link PayrollJobCompletedHandler} — handles PayrollJobCompleted events
 * - {@link TransactionHandler} — handles Completed/Failed events
 * - {@link PayslipHandler} — handles PayslipGenerated events
 *
 * Imports {@link ProjectionMongooseModule} for Mongoose model registration.
 */
@Module({
  imports: [ProjectionMongooseModule],
  providers: [
    IdempotencyService,
    PayrollJobHandler,
    PayrollJobCompletedHandler,
    TransactionHandler,
    PayslipHandler,
  ],
  exports: [PayrollJobHandler, PayrollJobCompletedHandler, TransactionHandler, PayslipHandler],
})
export class ProjectionModule {}
