import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';

/**
 * NestJS module that provides shared authentication and authorization
 * infrastructure for all services.
 *
 * Registers:
 * - `JwtModule` globally so that `JwtService` is available everywhere
 * - `JwtAuthGuard` for JWT token validation
 * - `RolesGuard` for role-based access control
 *
 * ## Usage
 *
 * ```ts
 * // app.module.ts
 * \@Module({
 *   imports: [AuthGuardsModule],
 * })
 * export class AppModule {}
 * ```
 *
 * Then in any controller:
 * ```ts
 * \@UseGuards(JwtAuthGuard, RolesGuard)
 * \@Roles('ADMIN')
 * \@Get('admin')
 * adminOnly() { ... }
 * ```
 */
@Global()
@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  providers: [JwtAuthGuard, RolesGuard],
  exports: [JwtModule, JwtAuthGuard, RolesGuard],
})
export class AuthGuardsModule {}
