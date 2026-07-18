import { Money } from '@payroll/shared-kernel';
import { Payslip } from './payslip.entity';

describe('Payslip', () => {
  const payslipId = 'ps-123';
  const transactionId = 'pt-456';
  const jobId = 'pj-789';
  const employeeId = 'emp-001';
  const companyId = 'comp-1';
  const periodId = 'pp-001';

  it('should create a payslip with the provided values', () => {
    const grossPay = Money.fromCents(500000, 'USD');
    const deductions = Money.fromCents(100000, 'USD');
    const netPay = Money.fromCents(400000, 'USD');

    const payslip = new Payslip(
      payslipId,
      transactionId,
      jobId,
      employeeId,
      companyId,
      periodId,
      grossPay,
      deductions,
      netPay,
    );

    expect(payslip.id).toBe(payslipId);
    expect(payslip.transactionId).toBe(transactionId);
    expect(payslip.jobId).toBe(jobId);
    expect(payslip.employeeId).toBe(employeeId);
    expect(payslip.companyId).toBe(companyId);
    expect(payslip.periodId).toBe(periodId);
    expect(payslip.grossPay.amount).toBe(500000);
    expect(payslip.deductions.amount).toBe(100000);
    expect(payslip.netPay.amount).toBe(400000);
    expect(payslip.generatedAt).toBeInstanceOf(Date);
  });

  it('should throw when grossPay and deductions have different currencies', () => {
    expect(
      () =>
        new Payslip(
          payslipId,
          transactionId,
          jobId,
          employeeId,
          companyId,
          periodId,
          Money.fromCents(500000, 'USD'),
          Money.fromCents(100000, 'EUR'),
          Money.fromCents(400000, 'USD'),
        ),
    ).toThrow();
  });

  it('should be immutable (properties are readonly)', () => {
    const payslip = new Payslip(
      payslipId,
      transactionId,
      jobId,
      employeeId,
      companyId,
      periodId,
      Money.fromCents(500000, 'USD'),
      Money.fromCents(100000, 'USD'),
      Money.fromCents(400000, 'USD'),
    );

    // Verify the object is frozen
    expect(Object.isFrozen(payslip)).toBe(true);
  });
});
