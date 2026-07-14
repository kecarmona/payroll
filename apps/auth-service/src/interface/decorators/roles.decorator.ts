import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../domain/user-role';

/**
 * Metadata key used by {@link RolesGuard} to look up required roles.
 */
export const ROLES_KEY = 'roles';

/**
 * Decorator that marks a route handler (or controller) with the roles
 * that are allowed to access it.
 *
 * The {@link RolesGuard} reads this metadata and compares it against
 * the authenticated user's roles from the JWT payload.
 *
 * @example
 * ```ts
 * \@Roles(UserRole.ADMIN)
 * \@UseGuards(JwtAuthGuard, RolesGuard)
 * \@Get('admin-only')
 * adminEndpoint() { ... }
 * ```
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
