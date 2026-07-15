import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/**
 * Type-safe document type for PayrollJob projections.
 * Represents a denormalized read-model of a payroll job stored in MongoDB.
 */
export type PayrollJobDocument = HydratedDocument<PayrollJobProjection>;

/**
 * Mongoose schema definition for the PayrollJob projection collection.
 *
 * Stores denormalized payroll job data consumed from PayrollJobCreated
 * and PayrollJobCompleted/Failed events. Used by the projection REST API
 * for dashboard and reporting queries.
 */
@Schema({ timestamps: true, collection: 'payroll_job_projections' })
export class PayrollJobProjection {
  /** Unique identifier of the payroll job (from the source aggregate). */
  @Prop({ required: true, unique: true })
  jobId!: string;

  /** Tenant (company) that owns this payroll job. */
  @Prop({ required: true, index: true })
  companyId!: string;

  /** Payroll period identifier. */
  @Prop({ required: true })
  periodId!: string;

  /** Current status: CREATED, PROCESSING, COMPLETED, FAILED. */
  @Prop({ required: true, default: 'CREATED' })
  status!: string;

  /** Total number of eligible employees for this payroll. */
  @Prop({ default: 0 })
  totalEmployees!: number;

  /** Count of successfully processed transactions. */
  @Prop({ default: 0 })
  processedCount!: number;

  /** Count of failed transactions. */
  @Prop({ default: 0 })
  failedCount!: number;

  /** Source event ID for idempotency tracking. */
  @Prop({ required: true })
  lastEventId!: string;
}

/** The compiled Mongoose schema for PayrollJobProjection. */
export const PayrollJobSchema = SchemaFactory.createForClass(PayrollJobProjection);

/**
 * Factory function that creates the Mongoose schema for PayrollJobProjection.
 * Useful for testing and for module-level schema creation.
 *
 * @returns A Mongoose {@link Schema} instance configured for PayrollJobProjection.
 */
export function createPayrollJobSchema() {
  return PayrollJobSchema;
}
