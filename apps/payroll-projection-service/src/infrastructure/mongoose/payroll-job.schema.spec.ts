import mongoose from 'mongoose';
import { createPayrollJobSchema } from './payroll-job.schema';

describe('PayrollJobSchema', () => {
  let schema: mongoose.Schema;

  beforeAll(() => {
    schema = createPayrollJobSchema();
  });

  it('should define all required fields', () => {
    const paths = schema.paths;

    expect(paths['jobId']).toBeDefined();
    expect(paths['companyId']).toBeDefined();
    expect(paths['periodId']).toBeDefined();
    expect(paths['status']).toBeDefined();
    expect(paths['totalEmployees']).toBeDefined();
    expect(paths['processedCount']).toBeDefined();
    expect(paths['failedCount']).toBeDefined();
    expect(paths['createdAt']).toBeDefined();
    expect(paths['updatedAt']).toBeDefined();
    expect(paths['lastEventId']).toBeDefined();
  });

  it('should define jobId as a required string field', () => {
    const path = schema.path('jobId');
    expect(path).toBeDefined();
    expect((path as unknown as { options: Record<string, unknown> }).options).toMatchObject({
      required: true,
    });
  });

  it('should define companyId as a required string field', () => {
    const path = schema.path('companyId');
    expect(path).toBeDefined();
    expect((path as unknown as { options: Record<string, unknown> }).options).toMatchObject({
      required: true,
    });
  });

  it('should define status as required with default CREATED', () => {
    const path = schema.path('status');
    expect(path).toBeDefined();
    const options = (path as unknown as { options: Record<string, unknown> }).options;
    expect(options).toMatchObject({ required: true });
    expect(options.default).toBe('CREATED');
  });

  it('should set default values for numeric counters', () => {
    const totalEmployeesOpts = (
      schema.path('totalEmployees') as unknown as { options: Record<string, unknown> }
    ).options;
    const processedCountOpts = (
      schema.path('processedCount') as unknown as { options: Record<string, unknown> }
    ).options;
    const failedCountOpts = (
      schema.path('failedCount') as unknown as { options: Record<string, unknown> }
    ).options;

    expect(totalEmployeesOpts.default).toBe(0);
    expect(processedCountOpts.default).toBe(0);
    expect(failedCountOpts.default).toBe(0);
  });

  it('should have a unique index on jobId', () => {
    const indexes = schema.indexes();
    const index = indexes.find(([fields]) => 'jobId' in fields);
    expect(index).toBeDefined();
    expect(index?.[1]).toMatchObject({ unique: true });
  });

  it('should have an index on companyId', () => {
    const indexes = schema.indexes();
    const index = indexes.find(([fields]) => 'companyId' in fields);
    expect(index).toBeDefined();
  });

  it('should include timestamps option', () => {
    expect(schema.get('timestamps')).toBe(true);
  });

  it('should store numeric fields as Number type', () => {
    expect(
      (schema.path('totalEmployees') as unknown as { instance: string }).instance,
    ).toBe('Number');
    expect(
      (schema.path('processedCount') as unknown as { instance: string }).instance,
    ).toBe('Number');
    expect(
      (schema.path('failedCount') as unknown as { instance: string }).instance,
    ).toBe('Number');
  });
});
