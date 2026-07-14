import { EmployeeEmail } from './employee-email';

describe('EmployeeEmail', () => {
  describe('creation', () => {
    it('should create from a valid email', () => {
      const email = EmployeeEmail.from('employee@example.com');
      expect(email.value).toBe('employee@example.com');
    });

    it('should accept emails with subdomain', () => {
      const email = EmployeeEmail.from('user@sub.example.com');
      expect(email.value).toBe('user@sub.example.com');
    });

    it('should accept emails with plus sign', () => {
      const email = EmployeeEmail.from('user+tag@example.com');
      expect(email.value).toBe('user+tag@example.com');
    });

    it('should accept emails with dots in local part', () => {
      const email = EmployeeEmail.from('first.last@example.com');
      expect(email.value).toBe('first.last@example.com');
    });

    it('should accept empty string for auto-provisioned users', () => {
      const email = EmployeeEmail.from('');
      expect(email.value).toBe('');
    });
  });

  describe('validation', () => {
    it('should throw for email without @', () => {
      expect(() => EmployeeEmail.from('invalid')).toThrow();
    });

    it('should throw for email without domain', () => {
      expect(() => EmployeeEmail.from('user@')).toThrow();
    });

    it('should throw for email without local part', () => {
      expect(() => EmployeeEmail.from('@example.com')).toThrow();
    });

    it('should throw for whitespace-only string', () => {
      expect(() => EmployeeEmail.from('   ')).toThrow();
    });
  });

  describe('equality', () => {
    it('should be equal for the same email address', () => {
      const email1 = EmployeeEmail.from('emp@example.com');
      const email2 = EmployeeEmail.from('emp@example.com');
      expect(email1.equals(email2)).toBe(true);
    });

    it('should not be equal for different email addresses', () => {
      const email1 = EmployeeEmail.from('emp1@example.com');
      const email2 = EmployeeEmail.from('emp2@example.com');
      expect(email1.equals(email2)).toBe(false);
    });

    it('should not be equal when compared to undefined', () => {
      const email = EmployeeEmail.from('emp@example.com');
      expect(email.equals(undefined)).toBe(false);
    });
  });
});
