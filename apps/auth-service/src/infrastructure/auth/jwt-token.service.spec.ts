import { JwtService } from '@nestjs/jwt';
import { JwtTokenService } from './jwt-token.service';
import { User } from '../../domain/user.entity';
import { UserId } from '../../domain/user-id';
import { UserEmail } from '../../domain/user-email';
import { UserRole } from '../../domain/user-role';
import type { PasswordHasher } from '../../domain/password-hasher';

class FakePasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    return `hashed:${password}`;
  }

  async verify(password: string, hash: string): Promise<boolean> {
    return hash === `hashed:${password}`;
  }
}

describe('JwtTokenService', () => {
  let jwtTokenService: JwtTokenService;
  let jwtService: JwtService;
  let testUser: User;

  beforeAll(async () => {
    const userId = UserId.create();
    const email = UserEmail.from('test@example.com');

    testUser = await User.register(
      userId,
      email,
      UserRole.EMPLOYEE,
      'company-1',
      'password123',
      new FakePasswordHasher(),
    );
  });

  beforeEach(() => {
    jwtService = new JwtService({
      secret: 'test-secret-key',
    });
    jwtTokenService = new JwtTokenService(jwtService);
  });

  describe('generateTokens', () => {
    it('should return an access token, refresh token, and expiration', async () => {
      const tokens = await jwtTokenService.generateTokens(testUser);

      expect(tokens).toBeDefined();
      expect(tokens.accessToken).toBeDefined();
      expect(typeof tokens.accessToken).toBe('string');
      expect(tokens.refreshToken).toBeDefined();
      expect(typeof tokens.refreshToken).toBe('string');
      expect(tokens.expiresIn).toBe(900); // 15 minutes
    });

    it('should return a valid JWT access token', async () => {
      const tokens = await jwtTokenService.generateTokens(testUser);

      // Decode and verify the token
      const decoded = jwtService.decode(tokens.accessToken) as Record<string, unknown>;

      expect(decoded).toBeDefined();
      expect(decoded.sub).toBe(testUser.id);
      expect(decoded.email).toBe('test@example.com');
      expect(decoded.roles).toEqual(['EMPLOYEE']);
      expect(decoded.companyId).toBe('company-1');
    });

    it('should include iat and exp claims in the access token', async () => {
      const tokens = await jwtTokenService.generateTokens(testUser);

      const decoded = jwtService.decode(tokens.accessToken) as Record<string, unknown>;

      expect(decoded.iat).toBeDefined();
      expect(typeof decoded.iat).toBe('number');
      expect(decoded.exp).toBeDefined();
      expect(typeof decoded.exp).toBe('number');
      // exp should be greater than iat
      expect((decoded.exp as number) - (decoded.iat as number)).toBe(900);
    });

    it('should return a UUID v4 as the refresh token', async () => {
      const tokens = await jwtTokenService.generateTokens(testUser);

      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      expect(tokens.refreshToken).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('should generate a different refresh token on each call', async () => {
      const tokens1 = await jwtTokenService.generateTokens(testUser);
      const tokens2 = await jwtTokenService.generateTokens(testUser);

      expect(tokens1.refreshToken).not.toBe(tokens2.refreshToken);
    });

    // NOTE: Access tokens can be identical if generated within the same second
    // (same `iat` claim with identical payload and secret). This is expected
    // JWT behavior and does not indicate a bug. The refresh token uniqueness
    // is tested above.
  });
});
