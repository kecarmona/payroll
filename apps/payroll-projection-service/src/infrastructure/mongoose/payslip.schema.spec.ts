import mongoose from 'mongoose';
import { createPayslipSchema } from './payslip.schema';

describe('PayslipSchema', () => {
  let schema: mongoose.Schema;

  beforeAll(() => {
    schema = createPayslipSchema();
  });

  it('should define all required fields', () => {
    const paths = schema.paths;

    expect(paths['payslipId']).toBeDefined();
    expect(paths['transactionId']).toBeDefined();
    expect(paths['jobId']).toBeDefined();
    expect(paths['employeeId']).toBeDefined();
    expect(paths['companyId']).toBeDefined();
    expect(paths['periodId']).toBeDefined();
    expect(paths['grossPay']).toBeDefined();
    expect(paths['deductions']).toBeDefined();
    expect(paths['netPay']).toBeDefined();
    expect(paths['generatedAt']).toBeDefined();
    expect(paths['lastEventId']).toBeDefined();
  });

  it('should mark payslipId as required and unique', () => {
    const options = (
      schema.path('payslipId') as unknown as { options: Record<string, unknown> }
    ).options;
    expect(options).toMatchObject({ required: true });

    const indexes = schema.indexes();
    const index = indexes.find(([fields]) => 'payslipId' in fields);
    expect(index).toBeDefined();
    expect(index?.[1]).toMatchObject({ unique: true });
  });

  it('should have an index on jobId', () => {
    const indexes = schema.indexes();
    const index = indexes.find(([fields]) => 'jobId' in fields);
    expect(index).toBeDefined();
  });

  it('should mark transactionId, jobId, employeeId as required', () => {
    expect(
      (schema.path('transactionId') as unknown as { options: Record<string, unknown> }).options,
    ).toMatchObject({ required: true });
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
});
