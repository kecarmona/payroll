/**
 * Shared authentication and authorization guards for all payroll services.
 *
 * Provides:
 * - {@link JwtAuthGuard} — validates JWT tokens from Bearer headers
 * - {@link RolesGuard} — enforces role-based access via `@Roles()` decorator
 * - {@link Roles} — decorator to set required roles metadata
 * - {@link CurrentUser} — parameter decorator to extract authenticated user
 * - {@link AuthGuardsModule} — NestJS module with global JWT configuration
 */

export { JwtAuthGuard } from './lib/jwt-auth.guard';
export { RolesGuard } from './lib/roles.guard';
export { Roles, ROLES_KEY } from './lib/roles.decorator';
export { CurrentUser } from './lib/current-user.decorator';
export { AuthGuardsModule } from './lib/auth-guards.module';
