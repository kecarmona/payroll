import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/**
 * Type-safe document type for PayrollTransaction projections.
 * Represents a denormalized read-model of a payroll transaction stored in MongoDB.
 */
export type PayrollTransactionDocument = HydratedDocument<PayrollTransactionProjection>;

/**
 * Mongoose schema definition for the PayrollTransaction projection collection.
 *
 * Stores denormalized per-employee transaction data consumed from
 * PayrollTransactionCompleted and PayrollTransactionFailed events.
 * Used by the projection REST API for transaction-level queries.
 */
@Schema({ timestamps: true, collection: 'payroll_transaction_projections' })
export class PayrollTransactionProjection {
  /** Unique identifier of the source transaction. */
  @Prop({ required: true, unique: true })
  transactionId!: string;

  /** The parent payroll job identifier. */
  @Prop({ required: true, index: true })
  jobId!: string;

  /** The employee this transaction belongs to. */
  @Prop({ required: true })
  employeeId!: string;

  /** Tenant (company) that owns this transaction. */
  @Prop({ required: true })
  companyId!: string;

  /** Payroll period identifier. */
  @Prop({ required: true })
  periodId!: string;

  /** Current status: PENDING, PROCESSING, COMPLETED, FAILED. */
  @Prop({ required: true, default: 'PENDING' })
  status!: string;

  /** Gross pay amount (in currency units, not cents). */
  @Prop({ type: Number })
  grossPay?: number;

  /** Total deductions (in currency units, not cents). */
  @Prop({ type: Number })
  deductions?: number;

  /** Net pay after deductions (in currency units, not cents). */
  @Prop({ type: Number })
  netPay?: number;

  /** Source event ID for idempotency tracking. */
  @Prop({ required: true })
  lastEventId!: string;
}

/** The compiled Mongoose schema for PayrollTransactionProjection. */
export const PayrollTransactionSchema =
  SchemaFactory.createForClass(PayrollTransactionProjection);

/**
 * Factory function that creates the Mongoose schema for PayrollTransactionProjection.
 * Useful for testing and for module-level schema creation.
 *
 * @returns A Mongoose {@link Schema} instance configured for PayrollTransactionProjection.
 */
export function createPayrollTransactionSchema() {
  return PayrollTransactionSchema;
}
