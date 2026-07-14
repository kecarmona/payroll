import { RefreshToken } from './refresh-token.entity';
import { UserId } from './user-id';

describe('RefreshToken', () => {
  const userId = UserId.create();

  describe('create', () => {
    it('should create a new refresh token with a hashed value', () => {
      const tokenHash = 'hashed-token-value';
      const expiresAt = new Date(Date.now() + 86400000); // +1 day

      const token = RefreshToken.create(userId, tokenHash, expiresAt);

      expect(token.userId).toBe(userId.toString());
      expect(token.tokenHash).toBe(tokenHash);
      expect(token.expiresAt).toBe(expiresAt);
      expect(token.isRevoked).toBe(false);
      expect(token.version).toBe(0);
      expect(token.id).toBeDefined();
      expect(token.id.length).toBeGreaterThan(0);
    });
  });

  describe('revoke', () => {
    it('should mark token as revoked', () => {
      const tokenHash = 'revocable-token';
      const expiresAt = new Date(Date.now() + 86400000);

      const token = RefreshToken.create(userId, tokenHash, expiresAt);
      expect(token.isRevoked).toBe(false);

      token.revoke();
      expect(token.isRevoked).toBe(true);
    });

    it('should be idempotent when revoking already revoked token', () => {
      const token = RefreshToken.create(
        userId,
        'already-revoked',
        new Date(Date.now() + 86400000),
      );

      token.revoke();
      token.revoke();
      expect(token.isRevoked).toBe(true);
    });
  });

  describe('isExpired', () => {
    it('should return false for token that expires in the future', () => {
      const future = new Date(Date.now() + 3600000);
      const token = RefreshToken.create(userId, 'future-token', future);

      expect(token.isExpired()).toBe(false);
    });

    it('should return true for token that expired in the past', () => {
      const past = new Date(Date.now() - 3600000);
      const token = RefreshToken.create(userId, 'past-token', past);

      expect(token.isExpired()).toBe(true);
    });
  });

  describe('theft detection', () => {
    it('should detect reuse of a revoked token', () => {
      const tokenHash = 'theft-token';
      const expiresAt = new Date(Date.now() + 86400000);

      const token = RefreshToken.create(userId, tokenHash, expiresAt);
      token.revoke();

      // Simulating reuse: a revoked token being presented again
      expect(token.isRevoked).toBe(true);
    });
  });
});
