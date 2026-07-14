import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { RegisterUserHandler, RegisterUserCommand } from '../application/register-user.command';
import { LoginHandler, LoginCommand } from '../application/login.command';
import { RefreshTokenHandler, RefreshTokenCommand } from '../application/refresh-token.command';
import { DeactivateUserHandler, DeactivateUserCommand } from '../application/deactivate-user.command';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { UserRole } from '../domain/user-role';

interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  companyId: string;
}

/**
 * Authentication controller.
 *
 * Handles user registration, login (JWT + refresh token),
 * token refresh/rotation, and user deactivation.
 *
 * All endpoints are grouped under `/auth` and documented
 * with OpenAPI/Swagger decorators for API exploration.
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserHandler: RegisterUserHandler,
    private readonly loginHandler: LoginHandler,
    private readonly refreshTokenHandler: RefreshTokenHandler,
    private readonly deactivateUserHandler: DeactivateUserHandler,
  ) {}

  /**
   * Register a new user account.
   *
   * Creates a user with the given email, password, and role.
   * The password is hashed with bcrypt before storage. Returns
   * the new user's unique identifier.
   */
  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Creates a new user account with email, password, and role. ' +
      'The password is hashed with bcrypt before storage.',
  })
  @ApiBody({ type: RegisterUserDto })
  @ApiCreatedResponse({
    description: 'User registered successfully',
    schema: {
      type: 'object',
      properties: { userId: { type: 'string', example: 'userId-uuid' } },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation error (invalid email, weak password, duplicate email)',
  })
  async register(
    @Body() dto: RegisterUserDto,
  ): Promise<{ userId: string }> {
    const command = new RegisterUserCommand(
      dto.email,
      dto.password,
      dto.role,
      'default-company',
    );
    const userId = await this.registerUserHandler.execute(command);
    return { userId };
  }

  /**
   * Authenticate a user and issue tokens.
   *
   * Validates email and password credentials against the stored
   * bcrypt hash. On success, returns a JWT access token (15 min TTL)
   * and a UUID refresh token (7 day TTL, stored hashed server-side).
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authenticate and receive JWT tokens',
    description:
      'Validates email/password credentials and returns a JWT access token ' +
      'and a UUID refresh token for session management.',
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'Authentication successful',
    type: TokenResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials or deactivated user',
  })
  async login(@Body() dto: LoginDto): Promise<TokenResponseDto> {
    const command = new LoginCommand(dto.email, dto.password);
    return this.loginHandler.execute(command);
  }

  /**
   * Refresh an expired access token.
   *
   * Accepts a valid refresh token, revokes it (rotation), and issues
   * a new JWT access token + refresh token pair. If a revoked token
   * is used, all user sessions are invalidated (theft detection).
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Accepts a valid refresh token, revokes it (rotation), and issues a new ' +
      'JWT access token + refresh token pair. Implements theft detection: if a ' +
      'revoked token is reused, all user sessions are invalidated.',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiOkResponse({
    description: 'Token refreshed successfully',
    type: TokenResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid, revoked, or expired refresh token',
  })
  async refresh(@Body() dto: RefreshTokenDto): Promise<TokenResponseDto> {
    const command = new RefreshTokenCommand(dto.refreshToken);
    return this.refreshTokenHandler.execute(command);
  }

  /**
   * Deactivate a user account.
   *
   * Marks the user as inactive. Already-deactivated users are handled
   * idempotently (no-op). Requires ADMIN role.
   */
  @Post('deactivate/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Deactivate a user (ADMIN only)',
    description:
      'Marks a user as inactive. Idempotent — deactivating an already-deactivated ' +
      'user is a no-op. Requires ADMIN role.',
  })
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'User deactivated successfully' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  @ApiForbiddenResponse({ description: 'Insufficient role (ADMIN required)' })
  async deactivate(
    @Param('userId') userId: string,
    @CurrentUser() _user: JwtPayload,
  ): Promise<void> {
    void _user;
    const command = new DeactivateUserCommand(userId);
    await this.deactivateUserHandler.execute(command);
  }
}
