import { createHash } from 'crypto';
import { UserId } from '../domain/user-id';
import { RefreshToken } from '../domain/refresh-token.entity';
import type { UserRepository } from '../domain/user.repository';
import type { PasswordHasher } from '../domain/password-hasher';
import type { TokenService, TokenResponse } from '../domain/token-service';
import type { RefreshTokenRepository } from '../domain/refresh-token.repository';
import { AuthenticationError } from './errors';

/**
 * Command to authenticate a user with email and password.
 *
 * On success, returns an access token, a refresh token, and the
 * token lifetime. The refresh token is persisted (hashed) for
 * future rotation requests.
 */
export class LoginCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
  ) {}
}

/**
 * Handler for the LoginCommand.
 *
 * Validates credentials against the stored user, checks the account
 * is active, generates authentication tokens, and persists the
 * refresh token for future rotation.
 */
export class LoginHandler {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  /**
   * Executes the login command.
   *
   * @param command - The login credentials.
   * @returns A TokenResponse with access and refresh tokens.
   * @throws {AuthenticationError} If credentials are invalid or the user is deactivated.
   */
  async execute(command: LoginCommand): Promise<TokenResponse> {
    const user = await this.userRepository.findByEmail(command.email);
    if (!user) {
      throw new AuthenticationError();
    }

    const isPasswordValid = await user.authenticate(command.password, this.passwordHasher);
    if (!isPasswordValid) {
      throw new AuthenticationError();
    }

    const tokens = await this.tokenService.generateTokens(user);

    // Persist the refresh token (hashed) for future rotation
    const tokenHash = createHash('sha256').update(tokens.refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000);
    const userId = UserId.from(user.id);
    const refreshToken = RefreshToken.create(userId, tokenHash, expiresAt, user.companyId);
    await this.refreshTokenRepository.save(refreshToken);

    return tokens;
  }
}
