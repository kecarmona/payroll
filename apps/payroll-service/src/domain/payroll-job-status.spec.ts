import { PayrollJobStatus } from './payroll-job-status';

describe('PayrollJobStatus', () => {
  describe('constants', () => {
    it('should have CREATED status', () => {
      expect(PayrollJobStatus.CREATED.value).toBe('CREATED');
    });

    it('should have PROCESSING status', () => {
      expect(PayrollJobStatus.PROCESSING.value).toBe('PROCESSING');
    });

    it('should have COMPLETED status', () => {
      expect(PayrollJobStatus.COMPLETED.value).toBe('COMPLETED');
    });

    it('should have FAILED status', () => {
      expect(PayrollJobStatus.FAILED.value).toBe('FAILED');
    });
  });

  describe('transitions', () => {
    it('should allow CREATED to transition to PROCESSING', () => {
      expect(PayrollJobStatus.CREATED.canTransitionTo(PayrollJobStatus.PROCESSING)).toBe(true);
    });

    it('should not allow CREATED to transition to COMPLETED', () => {
      expect(PayrollJobStatus.CREATED.canTransitionTo(PayrollJobStatus.COMPLETED)).toBe(false);
    });

    it('should not allow CREATED to transition to FAILED', () => {
      expect(PayrollJobStatus.CREATED.canTransitionTo(PayrollJobStatus.FAILED)).toBe(false);
    });

    it('should not allow CREATED to transition to CREATED', () => {
      expect(PayrollJobStatus.CREATED.canTransitionTo(PayrollJobStatus.CREATED)).toBe(false);
    });

    it('should allow PROCESSING to transition to COMPLETED', () => {
      expect(PayrollJobStatus.PROCESSING.canTransitionTo(PayrollJobStatus.COMPLETED)).toBe(true);
    });

    it('should allow PROCESSING to transition to FAILED', () => {
      expect(PayrollJobStatus.PROCESSING.canTransitionTo(PayrollJobStatus.FAILED)).toBe(true);
    });

    it('should not allow PROCESSING to transition to CREATED', () => {
      expect(PayrollJobStatus.PROCESSING.canTransitionTo(PayrollJobStatus.CREATED)).toBe(false);
    });

    it('should not allow COMPLETED to transition to any status', () => {
      expect(PayrollJobStatus.COMPLETED.canTransitionTo(PayrollJobStatus.FAILED)).toBe(false);
      expect(PayrollJobStatus.COMPLETED.canTransitionTo(PayrollJobStatus.CREATED)).toBe(false);
      expect(PayrollJobStatus.COMPLETED.canTransitionTo(PayrollJobStatus.PROCESSING)).toBe(false);
    });

    it('should not allow FAILED to transition to any status', () => {
      expect(PayrollJobStatus.FAILED.canTransitionTo(PayrollJobStatus.COMPLETED)).toBe(false);
      expect(PayrollJobStatus.FAILED.canTransitionTo(PayrollJobStatus.CREATED)).toBe(false);
      expect(PayrollJobStatus.FAILED.canTransitionTo(PayrollJobStatus.PROCESSING)).toBe(false);
    });
  });

  describe('equality', () => {
    it('should be equal for the same status value', () => {
      expect(PayrollJobStatus.CREATED.equals(PayrollJobStatus.CREATED)).toBe(true);
    });

    it('should not be equal for different status values', () => {
      expect(PayrollJobStatus.CREATED.equals(PayrollJobStatus.PROCESSING)).toBe(false);
    });

    it('should not be equal when compared to undefined', () => {
      expect(PayrollJobStatus.CREATED.equals(undefined)).toBe(false);
    });
  });
});
