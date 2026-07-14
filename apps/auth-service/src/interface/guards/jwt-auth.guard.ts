import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

/**
 * Guard that validates JWT tokens from the `Authorization: Bearer <token>`
 * header and attaches the decoded payload to the request object.
 *
 * The decoded payload contains `sub`, `email`, `roles[]`, `companyId`,
 * `iat`, and `exp` claims as specified in the auth service design.
 *
 * @example
 * ```ts
 * \@UseGuards(JwtAuthGuard)
 * \@Get('protected')
 * protectedEndpoint(@CurrentUser() user: JwtPayload) { ... }
 * ```
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * Validates the Bearer token from the request's Authorization header.
   *
   * On success, the decoded JWT payload is attached to `request.user`
   * for downstream use (controllers, RolesGuard, etc.).
   *
   * @param context - The execution context.
   * @returns `true` if the token is valid.
   * @throws {UnauthorizedException} If the token is missing, malformed,
   *   expired, or has an invalid signature.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      // Attach the decoded payload to the request for downstream use
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (request as any).user = payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    return true;
  }

  /**
   * Extracts the Bearer token from the Authorization header.
   *
   * @param request - The incoming HTTP request.
   * @returns The token string, or `undefined` if the header is missing
   *   or is not a Bearer token.
   */
  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
