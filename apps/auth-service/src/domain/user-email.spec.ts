import { UserEmail } from './user-email';

describe('UserEmail', () => {
  describe('creation', () => {
    it('should create from a valid email', () => {
      const email = UserEmail.from('user@example.com');
      expect(email.value).toBe('user@example.com');
    });

    it('should accept emails with subdomain', () => {
      const email = UserEmail.from('user@sub.example.com');
      expect(email.value).toBe('user@sub.example.com');
    });

    it('should accept emails with plus sign', () => {
      const email = UserEmail.from('user+tag@example.com');
      expect(email.value).toBe('user+tag@example.com');
    });

    it('should accept emails with dots in local part', () => {
      const email = UserEmail.from('first.last@example.com');
      expect(email.value).toBe('first.last@example.com');
    });
  });

  describe('validation', () => {
    it('should throw for email without @', () => {
      expect(() => UserEmail.from('invalid')).toThrow();
    });

    it('should throw for email without domain', () => {
      expect(() => UserEmail.from('user@')).toThrow();
    });

    it('should throw for email without local part', () => {
      expect(() => UserEmail.from('@example.com')).toThrow();
    });

    it('should throw for empty string', () => {
      expect(() => UserEmail.from('')).toThrow();
    });

    it('should throw for whitespace-only string', () => {
      expect(() => UserEmail.from('   ')).toThrow();
    });
  });

  describe('equality', () => {
    it('should be equal for the same email address', () => {
      const email1 = UserEmail.from('user@example.com');
      const email2 = UserEmail.from('user@example.com');
      expect(email1.equals(email2)).toBe(true);
    });

    it('should not be equal for different email addresses', () => {
      const email1 = UserEmail.from('user@example.com');
      const email2 = UserEmail.from('other@example.com');
      expect(email1.equals(email2)).toBe(false);
    });

    it('should not be equal when compared to undefined', () => {
      const email = UserEmail.from('user@example.com');
      expect(email.equals(undefined)).toBe(false);
    });
  });
});
