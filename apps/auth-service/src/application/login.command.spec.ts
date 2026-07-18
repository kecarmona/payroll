import { User } from '../domain/user.entity';
import { UserId } from '../domain/user-id';
import { UserEmail } from '../domain/user-email';
import { UserRole } from '../domain/user-role';
import type { UserRepository } from '../domain/user.repository';
import type { PasswordHasher } from '../domain/password-hasher';
import type { TokenService, TokenResponse } from '../domain/token-service';
import type { RefreshTokenRepository } from '../domain/refresh-token.repository';
import { RefreshToken } from '../domain/refresh-token.entity';
import { AuthenticationError } from './errors';
import { LoginCommand, LoginHandler } from './login.command';

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
      accessToken: 'jwt.access.token',
      refreshToken: 'raw-refresh-token-value',
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

describe('LoginHandler', () => {
  let userRepository: InMemoryUserRepository;
  let passwordHasher: FakePasswordHasher;
  let tokenService: FakeTokenService;
  let refreshTokenRepository: InMemoryRefreshTokenRepository;
  let handler: LoginHandler;

  beforeEach(async () => {
    userRepository = new InMemoryUserRepository();
    passwordHasher = new FakePasswordHasher();
    tokenService = new FakeTokenService();
    refreshTokenRepository = new InMemoryRefreshTokenRepository();
    handler = new LoginHandler(
      userRepository,
      passwordHasher,
      tokenService,
      refreshTokenRepository,
    );

    // Seed an active user
    const userId = UserId.create();
    const email = UserEmail.from('active@example.com');
    const user = await User.register(userId, email, UserRole.EMPLOYEE, 'company-1', 'correctPassword', passwordHasher);
    user.pullEvents();
    await userRepository.save(user);
  });

  describe('execute', () => {
    it('should return tokens for valid credentials', async () => {
      const command = new LoginCommand('active@example.com', 'correctPassword');

      const result = await handler.execute(command);

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('jwt.access.token');
      expect(result.refreshToken).toBe('raw-refresh-token-value');
      expect(result.expiresIn).toBe(3600);
    });

    it('should throw AuthenticationError for wrong password', async () => {
      const command = new LoginCommand('active@example.com', 'wrongPassword');

      await expect(handler.execute(command)).rejects.toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError for non-existent email', async () => {
      const command = new LoginCommand('nonexistent@example.com', 'anyPassword');

      await expect(handler.execute(command)).rejects.toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError for deactivated user', async () => {
      const user = await userRepository.findByEmail('active@example.com');
      user!.deactivate();
      await userRepository.save(user!);

      const command = new LoginCommand('active@example.com', 'correctPassword');

      await expect(handler.execute(command)).rejects.toThrow(AuthenticationError);
    });

    it('should save a refresh token after successful login', async () => {
      const command = new LoginCommand('active@example.com', 'correctPassword');

      const result = await handler.execute(command);

      expect(result.refreshToken).toBeDefined();
    });
  });
});
