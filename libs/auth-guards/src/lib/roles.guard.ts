import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

/**
 * Guard that enforces role-based access control by reading `@Roles()`
 * metadata from route handlers and comparing it against the user's
 * roles from the JWT payload (attached by {@link JwtAuthGuard}).
 *
 * If no roles metadata is set on the handler, access is granted
 * (open to any authenticated user). If roles are specified, the user
 * must have at least one of the required roles.
 *
 * @example
 * ```ts
 * \@Roles('ADMIN')
 * \@UseGuards(JwtAuthGuard, RolesGuard)
 * \@Get('admin')
 * adminOnly() { ... }
 * ```
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  /**
   * Determines whether the current user has at least one of the required
   * roles defined via the `@Roles()` decorator.
   *
   * @param context - The execution context.
   * @returns `true` if access is granted.
   * @throws {ForbiddenException} If the user lacks the required roles
   *   or if no authenticated user is present.
   */
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No roles required = open to any authenticated user
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: { roles?: string[] } }>();
    const user = request.user;

    if (!user?.roles) {
      throw new ForbiddenException('Access denied: insufficient permissions');
    }

    const hasRole = requiredRoles.some((role) => user.roles?.includes(role));
    if (!hasRole) {
      throw new ForbiddenException('Access denied: insufficient permissions');
    }

    return true;
  }
}
