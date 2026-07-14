import { EmploymentStatus } from './employment-status';

describe('EmploymentStatus', () => {
  describe('constants', () => {
    it('should have ACTIVE status', () => {
      expect(EmploymentStatus.ACTIVE.value).toBe('ACTIVE');
    });

    it('should have TERMINATED status', () => {
      expect(EmploymentStatus.TERMINATED.value).toBe('TERMINATED');
    });
  });

  describe('transitions', () => {
    it('should allow ACTIVE to transition to TERMINATED', () => {
      expect(EmploymentStatus.ACTIVE.canTransitionTo(EmploymentStatus.TERMINATED)).toBe(
        true,
      );
    });

    it('should not allow ACTIVE to transition to ACTIVE', () => {
      expect(EmploymentStatus.ACTIVE.canTransitionTo(EmploymentStatus.ACTIVE)).toBe(
        false,
      );
    });

    it('should not allow TERMINATED to transition to ACTIVE', () => {
      expect(
        EmploymentStatus.TERMINATED.canTransitionTo(EmploymentStatus.ACTIVE),
      ).toBe(false);
    });

    it('should not allow TERMINATED to transition to TERMINATED', () => {
      expect(
        EmploymentStatus.TERMINATED.canTransitionTo(EmploymentStatus.TERMINATED),
      ).toBe(false);
    });
  });

  describe('equality', () => {
    it('should be equal for the same status value', () => {
      expect(EmploymentStatus.ACTIVE.equals(EmploymentStatus.ACTIVE)).toBe(true);
    });

    it('should not be equal for different status values', () => {
      expect(EmploymentStatus.ACTIVE.equals(EmploymentStatus.TERMINATED)).toBe(false);
    });

    it('should not be equal when compared to undefined', () => {
      expect(EmploymentStatus.ACTIVE.equals(undefined)).toBe(false);
    });
  });
});
