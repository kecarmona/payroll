import { PayrollTransactionStatus, canTransition } from './payroll-transaction-status';

describe('PayrollTransactionStatus', () => {
  describe('constants', () => {
    it('should have PENDING status', () => {
      expect(PayrollTransactionStatus.PENDING).toBe('PENDING');
    });

    it('should have PROCESSING status', () => {
      expect(PayrollTransactionStatus.PROCESSING).toBe('PROCESSING');
    });

    it('should have COMPLETED status', () => {
      expect(PayrollTransactionStatus.COMPLETED).toBe('COMPLETED');
    });

    it('should have FAILED status', () => {
      expect(PayrollTransactionStatus.FAILED).toBe('FAILED');
    });
  });

  describe('canTransition', () => {
    it('should allow PENDING to transition to PROCESSING', () => {
      expect(canTransition(PayrollTransactionStatus.PENDING, PayrollTransactionStatus.PROCESSING)).toBe(true);
    });

    it('should not allow PENDING to transition to COMPLETED', () => {
      expect(canTransition(PayrollTransactionStatus.PENDING, PayrollTransactionStatus.COMPLETED)).toBe(false);
    });

    it('should not allow PENDING to transition to FAILED', () => {
      expect(canTransition(PayrollTransactionStatus.PENDING, PayrollTransactionStatus.FAILED)).toBe(false);
    });

    it('should not allow PENDING to transition to PENDING', () => {
      expect(canTransition(PayrollTransactionStatus.PENDING, PayrollTransactionStatus.PENDING)).toBe(false);
    });

    it('should allow PROCESSING to transition to COMPLETED', () => {
      expect(canTransition(PayrollTransactionStatus.PROCESSING, PayrollTransactionStatus.COMPLETED)).toBe(true);
    });

    it('should allow PROCESSING to transition to FAILED', () => {
      expect(canTransition(PayrollTransactionStatus.PROCESSING, PayrollTransactionStatus.FAILED)).toBe(true);
    });

    it('should not allow PROCESSING to transition to PENDING', () => {
      expect(canTransition(PayrollTransactionStatus.PROCESSING, PayrollTransactionStatus.PENDING)).toBe(false);
    });

    it('should not allow COMPLETED to transition to any status', () => {
      expect(canTransition(PayrollTransactionStatus.COMPLETED, PayrollTransactionStatus.PENDING)).toBe(false);
      expect(canTransition(PayrollTransactionStatus.COMPLETED, PayrollTransactionStatus.PROCESSING)).toBe(false);
      expect(canTransition(PayrollTransactionStatus.COMPLETED, PayrollTransactionStatus.FAILED)).toBe(false);
    });

    it('should not allow FAILED to transition to any status', () => {
      expect(canTransition(PayrollTransactionStatus.FAILED, PayrollTransactionStatus.PENDING)).toBe(false);
      expect(canTransition(PayrollTransactionStatus.FAILED, PayrollTransactionStatus.PROCESSING)).toBe(false);
      expect(canTransition(PayrollTransactionStatus.FAILED, PayrollTransactionStatus.COMPLETED)).toBe(false);
    });
  });
});
