import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: JwtService;
  let mockContext: any;
  let mockRequest: any;
  let mockHttpArgumentsHost: any;

  beforeEach(() => {
    jwtService = new JwtService({ secret: 'test-secret' });
    guard = new JwtAuthGuard(jwtService);

    mockRequest = {
      headers: {},
      user: undefined,
    };

    mockHttpArgumentsHost = {
      getRequest: jest.fn().mockReturnValue(mockRequest),
      getResponse: jest.fn().mockReturnValue({}),
      getNext: jest.fn(),
    };

    mockContext = {
      switchToHttp: jest.fn().mockReturnValue(mockHttpArgumentsHost),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    };
  });

  describe('canActivate', () => {
    it('should return true for a valid Bearer token', async () => {
      const validToken = jwtService.sign({
        sub: 'user-1',
        email: 'test@example.com',
        roles: ['EMPLOYEE'],
        companyId: 'company-1',
      });

      mockRequest.headers.authorization = `Bearer ${validToken}`;

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user.sub).toBe('user-1');
      expect(mockRequest.user.email).toBe('test@example.com');
      expect(mockRequest.user.roles).toEqual(['EMPLOYEE']);
    });

    it('should throw UnauthorizedException when no Authorization header is present', async () => {
      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when Authorization header is not Bearer', async () => {
      mockRequest.headers.authorization = 'Basic someToken';

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for an invalid token (bad signature)', async () => {
      const badToken = jwtService.sign(
        { sub: 'user-1' },
        { secret: 'different-secret' },
      );

      mockRequest.headers.authorization = `Bearer ${badToken}`;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for an expired token', async () => {
      const expiredToken = jwtService.sign(
        { sub: 'user-1', email: 'test@example.com', roles: [], companyId: 'c1' },
        { expiresIn: '0s' },
      );

      mockRequest.headers.authorization = `Bearer ${expiredToken}`;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for a malformed token', async () => {
      mockRequest.headers.authorization = 'Bearer not-a-valid-token';

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
