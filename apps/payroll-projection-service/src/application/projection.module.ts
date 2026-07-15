import { Module } from '@nestjs/common';
import { ProjectionMongooseModule } from '../infrastructure/mongoose/projection-mongoose.module';
import { IdempotencyService } from './idempotency.service';
import { PayrollJobHandler } from './handlers/payroll-job.handler';
import { TransactionHandler } from './handlers/transaction.handler';
import { PayslipHandler } from './handlers/payslip.handler';

/**
 * NestJS module that wires the application layer of the projection service.
 *
 * Provides:
 * - {@link IdempotencyService} — idempotency checks across projection collections
 * - {@link PayrollJobHandler} — handles PayrollJobCreated events
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
    TransactionHandler,
    PayslipHandler,
  ],
  exports: [PayrollJobHandler, TransactionHandler, PayslipHandler],
})
export class ProjectionModule {}
