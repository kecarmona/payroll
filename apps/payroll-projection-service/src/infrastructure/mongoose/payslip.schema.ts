import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/**
 * Type-safe document type for Payslip projections.
 * Represents a denormalized read-model of a payslip stored in MongoDB.
 */
export type PayslipDocument = HydratedDocument<PayslipProjection>;

/**
 * Mongoose schema definition for the Payslip projection collection.
 *
 * Stores denormalized payslip data consumed from PayslipGenerated events.
 * Used by the projection REST API for payslip search and retrieval.
 */
@Schema({ timestamps: true, collection: 'payslip_projections' })
export class PayslipProjection {
  /** Unique identifier of the payslip. */
  @Prop({ required: true, unique: true })
  payslipId!: string;

  /** The source transaction identifier. */
  @Prop({ required: true })
  transactionId!: string;

  /** The parent payroll job identifier. */
  @Prop({ required: true, index: true })
  jobId!: string;

  /** The employee this payslip belongs to. */
  @Prop({ required: true })
  employeeId!: string;

  /** Tenant (company) that owns this payslip. */
  @Prop({ required: true })
  companyId!: string;

  /** Payroll period identifier. */
  @Prop({ required: true })
  periodId!: string;

  /** Gross pay amount (in currency units, not cents). */
  @Prop({ type: Number })
  grossPay?: number;

  /** Total deductions (in currency units, not cents). */
  @Prop({ type: Number })
  deductions?: number;

  /** Net pay after deductions (in currency units, not cents). */
  @Prop({ type: Number })
  netPay?: number;

  /** ISO timestamp when the payslip was generated. */
  @Prop({ required: true })
  generatedAt!: string;

  /** Source event ID for idempotency tracking. */
  @Prop({ required: true })
  lastEventId!: string;
}

/** The compiled Mongoose schema for PayslipProjection. */
export const PayslipSchema = SchemaFactory.createForClass(PayslipProjection);

/**
 * Factory function that creates the Mongoose schema for PayslipProjection.
 * Useful for testing and for module-level schema creation.
 *
 * @returns A Mongoose {@link Schema} instance configured for PayslipProjection.
 */
export function createPayslipSchema() {
  return PayslipSchema;
}
