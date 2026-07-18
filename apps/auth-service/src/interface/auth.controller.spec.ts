import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ValidationError } from '@payroll/shared-kernel';
import { UserRole } from '../domain/user-role';
import { RegisterUserHandler, RegisterUserCommand } from '../application/register-user.command';
import { LoginHandler, LoginCommand } from '../application/login.command';
import { RefreshTokenHandler, RefreshTokenCommand } from '../application/refresh-token.command';
import { DeactivateUserHandler, DeactivateUserCommand } from '../application/deactivate-user.command';
import { AuthController } from './auth.controller';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('AuthController', () => {
  let controller: AuthController;
  let mockRegisterHandler: jest.Mocked<RegisterUserHandler>;
  let mockLoginHandler: jest.Mocked<LoginHandler>;
  let mockRefreshHandler: jest.Mocked<RefreshTokenHandler>;
  let mockDeactivateHandler: jest.Mocked<DeactivateUserHandler>;

  beforeEach(async () => {
    mockRegisterHandler = {
      execute: jest.fn(),
    } as any;

    mockLoginHandler = {
      execute: jest.fn(),
    } as any;

    mockRefreshHandler = {
      execute: jest.fn(),
    } as any;

    mockDeactivateHandler = {
      execute: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: JwtService,
          useValue: new JwtService({ secret: 'test-secret' }),
        },
        {
          provide: RegisterUserHandler,
          useValue: mockRegisterHandler,
        },
        {
          provide: LoginHandler,
          useValue: mockLoginHandler,
        },
        {
          provide: RefreshTokenHandler,
          useValue: mockRefreshHandler,
        },
        {
          provide: DeactivateUserHandler,
          useValue: mockDeactivateHandler,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('POST /auth/register', () => {
    it('should call RegisterUserHandler and return the userId', async () => {
      mockRegisterHandler.execute.mockResolvedValue('new-user-id');

      const dto = new RegisterUserDto();
      Object.assign(dto, {
        email: 'newuser@example.com',
        password: 'securePass123',
        role: UserRole.EMPLOYEE,
      });

      const result = await controller.register(dto);

      expect(result).toEqual({ userId: 'new-user-id' });
      expect(mockRegisterHandler.execute).toHaveBeenCalledTimes(1);
      expect(mockRegisterHandler.execute).toHaveBeenCalledWith(
        expect.any(RegisterUserCommand),
      );

      const command = mockRegisterHandler.execute.mock.calls[0][0];
      expect(command.email).toBe('newuser@example.com');
      expect(command.password).toBe('securePass123');
      expect(command.role).toBe(UserRole.EMPLOYEE);
    });

    it('should propagate ValidationError from the handler', async () => {
      mockRegisterHandler.execute.mockRejectedValue(
        new ValidationError('email', 'A user with this email already exists'),
      );

      const dto = new RegisterUserDto();
      Object.assign(dto, {
        email: 'duplicate@example.com',
        password: 'password123',
        role: UserRole.HR,
      });

      await expect(controller.register(dto)).rejects.toThrow(ValidationError);
    });
  });

  describe('POST /auth/login', () => {
    it('should call LoginHandler and return TokenResponseDto', async () => {
      mockLoginHandler.execute.mockResolvedValue({
        accessToken: 'jwt-token',
        refreshToken: 'uuid-refresh-token',
        expiresIn: 900,
      });

      const dto = new LoginDto();
      Object.assign(dto, { email: 'user@example.com', password: 'password123' });

      const result = await controller.login(dto);

      expect(result.accessToken).toBe('jwt-token');
      expect(result.refreshToken).toBe('uuid-refresh-token');
      expect(result.expiresIn).toBe(900);
      expect(mockLoginHandler.execute).toHaveBeenCalledWith(
        expect.any(LoginCommand),
      );

      const command = mockLoginHandler.execute.mock.calls[0][0];
      expect(command.email).toBe('user@example.com');
      expect(command.password).toBe('password123');
    });
  });

  describe('POST /auth/refresh', () => {
    it('should call RefreshTokenHandler and return new tokens', async () => {
      mockRefreshHandler.execute.mockResolvedValue({
        accessToken: 'new-jwt-token',
        refreshToken: 'new-uuid-refresh-token',
        expiresIn: 900,
      });

      const dto = new RefreshTokenDto();
      Object.assign(dto, { refreshToken: '550e8400-e29b-41d4-a716-446655440000' });

      const result = await controller.refresh(dto);

      expect(result.accessToken).toBe('new-jwt-token');
      expect(result.refreshToken).toBe('new-uuid-refresh-token');
      expect(result.expiresIn).toBe(900);
      expect(mockRefreshHandler.execute).toHaveBeenCalledWith(
        expect.any(RefreshTokenCommand),
      );
    });
  });

  describe('POST /auth/deactivate', () => {
    it('should call DeactivateUserHandler with the userId from body', async () => {
      mockDeactivateHandler.execute.mockResolvedValue(undefined);

      await controller.deactivate('user-to-deactivate', {
        sub: 'admin-user',
        email: 'admin@company.com',
        roles: ['ADMIN'],
        companyId: 'comp-1',
      });

      expect(mockDeactivateHandler.execute).toHaveBeenCalledWith(
        expect.any(DeactivateUserCommand),
      );

      const command = mockDeactivateHandler.execute.mock.calls[0][0];
      expect(command.userId).toBe('user-to-deactivate');
    });

    it('should propagate errors from DeactivateUserHandler', async () => {
      mockDeactivateHandler.execute.mockRejectedValue(
        new Error('User not found'),
      );

      await expect(
        controller.deactivate('non-existent', {
          sub: 'admin',
          email: 'admin@company.com',
          roles: ['ADMIN'],
          companyId: 'comp-1',
        }),
      ).rejects.toThrow('User not found');
    });
  });
});
