import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PayrollJobProjection, PayrollJobSchema } from './payroll-job.schema';
import {
  PayrollTransactionProjection,
  PayrollTransactionSchema,
} from './payroll-transaction.schema';
import { PayslipProjection, PayslipSchema } from './payslip.schema';

/**
 * NestJS module that registers all Mongoose models for the projection service.
 *
 * Registers:
 * - {@link PayrollJobProjection} — denormalized payroll job data
 * - {@link PayrollTransactionProjection} — denormalized transaction data
 * - {@link PayslipProjection} — denormalized payslip data
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PayrollJobProjection.name, schema: PayrollJobSchema },
      { name: PayrollTransactionProjection.name, schema: PayrollTransactionSchema },
      { name: PayslipProjection.name, schema: PayslipSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class ProjectionMongooseModule {}
