import { createHash } from 'crypto';
import { User } from '../domain/user.entity';
import { UserId } from '../domain/user-id';
import { UserEmail } from '../domain/user-email';
import { UserRole } from '../domain/user-role';
import type { UserRepository } from '../domain/user.repository';
import type { PasswordHasher } from '../domain/password-hasher';
import type { TokenService, TokenResponse } from '../domain/token-service';
import type { RefreshTokenRepository } from '../domain/refresh-token.repository';
import { RefreshToken } from '../domain/refresh-token.entity';
import { RefreshTokenError } from './errors';
import { RefreshTokenCommand, RefreshTokenHandler } from './refresh-token.command';

// ---------------------------------------------------------------------------
// Fakes
// ---------------------------------------------------------------------------

class FakePasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    return `hashed:${password}`;
  }

  async verify(password: string, hash: string): Promise<boolean> {
    return hash === `hashed:${password}`;
  }
}

class InMemoryUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();

  async save(user: User): Promise<void> {
    this.users.set(user.id, user);
  }

  async findById(id: UserId): Promise<User | null> {
    return this.users.get(id.toString()) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }
}

class FakeTokenService implements TokenService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async generateTokens(_user: User): Promise<TokenResponse> {
    return {
      accessToken: 'new.jwt.token',
      refreshToken: 'new-raw-refresh-token',
      expiresIn: 3600,
    };
  }
}

class InMemoryRefreshTokenRepository implements RefreshTokenRepository {
  private tokens: Map<string, RefreshToken> = new Map();

  async save(token: RefreshToken): Promise<void> {
    this.tokens.set(token.id, token);
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    for (const token of this.tokens.values()) {
      if (token.tokenHash === tokenHash) {
        return token;
      }
    }
    return null;
  }

  async revokeAllForUser(userId: string): Promise<void> {
    for (const token of this.tokens.values()) {
      if (token.userId === userId) {
        token.revoke();
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RefreshTokenHandler', () => {
  let userRepository: InMemoryUserRepository;
  let passwordHasher: FakePasswordHasher;
  let tokenService: FakeTokenService;
  let refreshTokenRepository: InMemoryRefreshTokenRepository;
  let handler: RefreshTokenHandler;
  let userId: UserId;

  beforeEach(async () => {
    userRepository = new InMemoryUserRepository();
    passwordHasher = new FakePasswordHasher();
    tokenService = new FakeTokenService();
    refreshTokenRepository = new InMemoryRefreshTokenRepository();
    handler = new RefreshTokenHandler(
      refreshTokenRepository,
      userRepository,
      tokenService,
    );

    // Seed a user
    userId = UserId.create();
    const email = UserEmail.from('user@example.com');
    const user = await User.register(userId, email, UserRole.EMPLOYEE, 'company-1', 'password', passwordHasher);
    user.pullEvents();
    await userRepository.save(user);
  });

  describe('execute', () => {
    it('should return new tokens for a valid refresh token', async () => {
      // Seed a valid refresh token
      const rawToken = 'valid-raw-token';
      const tokenHash = createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 86400000);
      const refreshToken = RefreshToken.create(userId, tokenHash, expiresAt);
      await refreshTokenRepository.save(refreshToken);

      const command = new RefreshTokenCommand(rawToken);
      const result = await handler.execute(command);

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('new.jwt.token');
      expect(result.refreshToken).toBe('new-raw-refresh-token');
      expect(result.expiresIn).toBe(3600);
    });

    it('should revoke the old refresh token after rotation', async () => {
      const rawToken = 'rotating-token';
      const tokenHash = createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 86400000);
      const oldToken = RefreshToken.create(userId, tokenHash, expiresAt);
      await refreshTokenRepository.save(oldToken);

      const command = new RefreshTokenCommand(rawToken);
      await handler.execute(command);

      // The old token should be revoked
      const found = await refreshTokenRepository.findByTokenHash(tokenHash);
      expect(found).not.toBeNull();
      expect(found!.isRevoked).toBe(true);
    });

    it('should throw RefreshTokenError for a revoked token (theft detection)', async () => {
      const rawToken = 'theft-token';
      const tokenHash = createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 86400000);
      const token = RefreshToken.create(userId, tokenHash, expiresAt);
      token.revoke();
      await refreshTokenRepository.save(token);

      const command = new RefreshTokenCommand(rawToken);

      await expect(handler.execute(command)).rejects.toThrow(RefreshTokenError);
    });

    it('should throw RefreshTokenError for an expired token', async () => {
      const rawToken = 'expired-token';
      const tokenHash = createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() - 3600000); // 1 hour ago
      const token = RefreshToken.create(userId, tokenHash, expiresAt);
      await refreshTokenRepository.save(token);

      const command = new RefreshTokenCommand(rawToken);

      await expect(handler.execute(command)).rejects.toThrow(RefreshTokenError);
    });
  });
});
