import { BcryptPasswordHasher } from './bcrypt-password-hasher';

describe('BcryptPasswordHasher', () => {
  let hasher: BcryptPasswordHasher;

  beforeEach(() => {
    hasher = new BcryptPasswordHasher();
  });

  describe('hash', () => {
    it('should return a bcrypt hash string', async () => {
      const hash = await hasher.hash('mySecurePassword123');

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      // bcrypt hashes start with $2b$ or $2a$ followed by cost, salt, and hash
      expect(hash).toMatch(/^\$2[ab]\$\d{2}\$/);
    });

    it('should produce different hashes for the same password (different salt)', async () => {
      const hash1 = await hasher.hash('samePassword');
      const hash2 = await hasher.hash('samePassword');

      expect(hash1).not.toBe(hash2);
    });

    it('should produce hashes of expected length (60 chars for bcrypt)', async () => {
      const hash = await hasher.hash('lengthTest');

      expect(hash.length).toBe(60);
    });
  });

  describe('verify', () => {
    it('should return true for the correct password', async () => {
      const password = 'correctPassword!';
      const hash = await hasher.hash(password);

      const result = await hasher.verify(password, hash);

      expect(result).toBe(true);
    });

    it('should return false for an incorrect password', async () => {
      const hash = await hasher.hash('realPassword');

      const result = await hasher.verify('wrongPassword', hash);

      expect(result).toBe(false);
    });

    it('should handle empty password gracefully', async () => {
      const hash = await hasher.hash('notEmpty');

      const result = await hasher.verify('', hash);

      expect(result).toBe(false);
    });

    it('should return false for an invalid hash string', async () => {
      const result = await hasher.verify('password', 'not-a-valid-hash');

      // bcrypt.compare with invalid hash returns false (does not throw)
      expect(result).toBe(false);
    });
  });
});
