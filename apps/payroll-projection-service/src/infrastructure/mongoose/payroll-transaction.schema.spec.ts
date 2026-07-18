import mongoose from 'mongoose';
import { createPayrollTransactionSchema } from './payroll-transaction.schema';

describe('PayrollTransactionSchema', () => {
  let schema: mongoose.Schema;

  beforeAll(() => {
    schema = createPayrollTransactionSchema();
  });

  it('should define all required fields', () => {
    const paths = schema.paths;

    expect(paths['transactionId']).toBeDefined();
    expect(paths['jobId']).toBeDefined();
    expect(paths['employeeId']).toBeDefined();
    expect(paths['companyId']).toBeDefined();
    expect(paths['periodId']).toBeDefined();
    expect(paths['status']).toBeDefined();
    expect(paths['grossPay']).toBeDefined();
    expect(paths['deductions']).toBeDefined();
    expect(paths['netPay']).toBeDefined();
    expect(paths['createdAt']).toBeDefined();
    expect(paths['updatedAt']).toBeDefined();
    expect(paths['lastEventId']).toBeDefined();
  });

  it('should mark transactionId as required and unique', () => {
    const options = (
      schema.path('transactionId') as unknown as { options: Record<string, unknown> }
    ).options;
    expect(options).toMatchObject({ required: true });

    const indexes = schema.indexes();
    const index = indexes.find(([fields]) => 'transactionId' in fields);
    expect(index).toBeDefined();
    expect(index?.[1]).toMatchObject({ unique: true });
  });

  it('should have an index on jobId', () => {
    const indexes = schema.indexes();
    const index = indexes.find(([fields]) => 'jobId' in fields);
    expect(index).toBeDefined();
  });

  it('should mark jobId and employeeId as required', () => {
    expect(
      (schema.path('jobId') as unknown as { options: Record<string, unknown> }).options,
    ).toMatchObject({ required: true });
    expect(
      (schema.path('employeeId') as unknown as { options: Record<string, unknown> }).options,
    ).toMatchObject({ required: true });
  });

  it('should mark companyId and periodId as required', () => {
    expect(
      (schema.path('companyId') as unknown as { options: Record<string, unknown> }).options,
    ).toMatchObject({ required: true });
    expect(
      (schema.path('periodId') as unknown as { options: Record<string, unknown> }).options,
    ).toMatchObject({ required: true });
  });

  it('should set default status as PENDING', () => {
    const options = (
      schema.path('status') as unknown as { options: Record<string, unknown> }
    ).options;
    expect(options).toMatchObject({ required: true });
    expect(options.default).toBe('PENDING');
  });

  it('should store amounts as Number type', () => {
    expect(
      (schema.path('grossPay') as unknown as { instance: string }).instance,
    ).toBe('Number');
    expect(
      (schema.path('deductions') as unknown as { instance: string }).instance,
    ).toBe('Number');
    expect(
      (schema.path('netPay') as unknown as { instance: string }).instance,
    ).toBe('Number');
  });

  it('should include timestamps option', () => {
    expect(schema.get('timestamps')).toBe(true);
  });
});
