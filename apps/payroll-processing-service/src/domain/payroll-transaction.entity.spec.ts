import { PayrollEventType } from '@payroll/contracts';
import { Money } from '@payroll/shared-kernel';
import { PayrollTransaction } from './payroll-transaction.entity';
import { PayrollTransactionStatus } from './payroll-transaction-status';
import { InvalidTransactionStatusTransitionError } from './errors';

describe('PayrollTransaction', () => {
  const companyId = 'company-1';
  const jobId = 'pj-123';
  const employeeId = 'emp-789';
  const periodId = 'pp-001';

  describe('create', () => {
    it('should create a new transaction in PENDING status', () => {
      const tx = PayrollTransaction.create(companyId, jobId, employeeId, periodId);

      expect(tx.companyId).toBe(companyId);
      expect(tx.jobId).toBe(jobId);
      expect(tx.employeeId).toBe(employeeId);
      expect(tx.periodId).toBe(periodId);
      expect(tx.status).toBe(PayrollTransactionStatus.PENDING);
      expect(tx.id).toBeDefined();
    });

    it('should record a PayrollTransactionCreated event', () => {
      const tx = PayrollTransaction.create(companyId, jobId, employeeId, periodId);

      const events = tx.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe(PayrollEventType.PayrollTransactionCreated);
      expect(events[0].aggregateId).toBe(tx.id);
      expect(events[0].companyId).toBe(companyId);
    });

    it('should start with version 0', () => {
      const tx = PayrollTransaction.create(companyId, jobId, employeeId, periodId);
      expect(tx.version).toBe(0);
    });

    it('should have null amounts initially', () => {
      const tx = PayrollTransaction.create(companyId, jobId, employeeId, periodId);
      expect(tx.grossPay).toBeNull();
      expect(tx.deductions).toBeNull();
      expect(tx.netPay).toBeNull();
    });
  });

  describe('reconstitute', () => {
    it('should recreate a PayrollTransaction from persisted data without events', () => {
      const tx = PayrollTransaction.reconstitute({
        id: 'pt-123',
        companyId,
        jobId,
        employeeId,
        periodId,
        status: PayrollTransactionStatus.COMPLETED,
        grossPayCents: 500000,
        deductionsCents: 100000,
        netPayCents: 400000,
        currency: 'USD',
        version: 3,
      });

      expect(tx.id).toBe('pt-123');
      expect(tx.companyId).toBe(companyId);
      expect(tx.jobId).toBe(jobId);
      expect(tx.employeeId).toBe(employeeId);
      expect(tx.periodId).toBe(periodId);
      expect(tx.status).toBe(PayrollTransactionStatus.COMPLETED);
      expect(tx.grossPay?.amount).toBe(500000);
      expect(tx.deductions?.amount).toBe(100000);
      expect(tx.netPay?.amount).toBe(400000);
      expect(tx.version).toBe(3);

      const events = tx.pullEvents();
      expect(events).toHaveLength(0);
    });
  });

  describe('startProcessing', () => {
    it('should transition from PENDING to PROCESSING', () => {
      const tx = PayrollTransaction.create(companyId, jobId, employeeId, periodId);
      tx.pullEvents(); // clear creation event

      tx.startProcessing();

      expect(tx.status).toBe(PayrollTransactionStatus.PROCESSING);
    });

    it('should throw when not in PENDING state', () => {
      const tx = PayrollTransaction.create(companyId, jobId, employeeId, periodId);
      tx.pullEvents();
      tx.startProcessing();
      tx.pullEvents();

      expect(() => tx.startProcessing()).toThrow(InvalidTransactionStatusTransitionError);
    });
  });

  describe('complete', () => {
    it('should transition from PROCESSING to COMPLETED with amounts', () => {
      const tx = PayrollTransaction.create(companyId, jobId, employeeId, periodId);
      tx.pullEvents();
      tx.startProcessing();
      tx.pullEvents();

      const grossPay = Money.fromCents(500000, 'USD');
      const deductions = Money.fromCents(100000, 'USD');
      const netPay = Money.fromCents(400000, 'USD');

      tx.complete(grossPay, deductions, netPay);

      expect(tx.status).toBe(PayrollTransactionStatus.COMPLETED);
      expect(tx.grossPay?.amount).toBe(500000);
      expect(tx.deductions?.amount).toBe(100000);
      expect(tx.netPay?.amount).toBe(400000);
    });

    it('should record a PayrollTransactionCompleted event', () => {
      const tx = PayrollTransaction.create(companyId, jobId, employeeId, periodId);
      tx.pullEvents();
      tx.startProcessing();
      tx.pullEvents();

      tx.complete(
        Money.fromCents(500000, 'USD'),
        Money.fromCents(100000, 'USD'),
        Money.fromCents(400000, 'USD'),
      );

      const events = tx.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe(PayrollEventType.PayrollTransactionCompleted);
    });

    it('should throw when not in PROCESSING state', () => {
      const tx = PayrollTransaction.create(companyId, jobId, employeeId, periodId);
      tx.pullEvents();

      expect(() =>
        tx.complete(
          Money.fromCents(500000, 'USD'),
          Money.fromCents(100000, 'USD'),
          Money.fromCents(400000, 'USD'),
        ),
      ).toThrow(InvalidTransactionStatusTransitionError);
    });

    it('should throw when currencies differ among amounts', () => {
      const tx = PayrollTransaction.create(companyId, jobId, employeeId, periodId);
      tx.pullEvents();
      tx.startProcessing();
      tx.pullEvents();

      expect(() =>
        tx.complete(
          Money.fromCents(500000, 'USD'),
          Money.fromCents(100000, 'EUR'),
          Money.fromCents(400000, 'USD'),
        ),
      ).toThrow();
    });
  });

  describe('fail', () => {
    it('should transition from PROCESSING to FAILED', () => {
      const tx = PayrollTransaction.create(companyId, jobId, employeeId, periodId);
      tx.pullEvents();
      tx.startProcessing();
      tx.pullEvents();

      tx.fail();

      expect(tx.status).toBe(PayrollTransactionStatus.FAILED);
    });

    it('should record a PayrollTransactionFailed event', () => {
      const tx = PayrollTransaction.create(companyId, jobId, employeeId, periodId);
      tx.pullEvents();
      tx.startProcessing();
      tx.pullEvents();

      tx.fail();

      const events = tx.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe(PayrollEventType.PayrollTransactionFailed);
    });

    it('should throw when not in PROCESSING state', () => {
      const tx = PayrollTransaction.create(companyId, jobId, employeeId, periodId);
      tx.pullEvents();

      expect(() => tx.fail()).toThrow(InvalidTransactionStatusTransitionError);
    });

    it('should throw when already FAILED', () => {
      const tx = PayrollTransaction.create(companyId, jobId, employeeId, periodId);
      tx.pullEvents();
      tx.startProcessing();
      tx.pullEvents();
      tx.fail();
      tx.pullEvents();

      expect(() => tx.fail()).toThrow(InvalidTransactionStatusTransitionError);
    });
  });
});
