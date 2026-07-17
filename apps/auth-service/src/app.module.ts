import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthGuardsModule } from '@payroll/auth-guards';
import { ObservabilityModule, MetricsController } from '@payroll/observability';
import { HealthController } from './health.controller';
import { AuthModule } from './infrastructure/auth.module';
import { AuthController } from './interface/auth.controller';
import {
  RegisterUserHandler,
} from './application/register-user.command';
import { LoginHandler } from './application/login.command';
import { RefreshTokenHandler } from './application/refresh-token.command';
import { DeactivateUserHandler } from './application/deactivate-user.command';
import {
  AUTH_REPOSITORY_TOKEN,
  REFRESH_TOKEN_REPOSITORY_TOKEN,
  PASSWORD_HASHER_TOKEN,
  TOKEN_SERVICE_TOKEN,
  EVENT_PUBLISHER_TOKEN,
} from './infrastructure/auth.module';

/**
 * Root application module for the Auth Service.
 *
 * Configures:
 * - Environment variable loading via `@nestjs/config`
 * - TypeORM connection to PostgreSQL
 * - Auth domain infrastructure (repositories, hasher, JWT)
 * - Application command handlers
 * - HTTP interface (controller + guards)
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST ?? 'localhost',
      port: Number(process.env.DATABASE_PORT ?? 5432),
      username: process.env.DATABASE_USER ?? 'payroll',
      password: process.env.DATABASE_PASSWORD ?? 'payroll',
      database: process.env.DATABASE_NAME ?? 'payroll_auth',
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    AuthGuardsModule,
    AuthModule,
    ObservabilityModule,
  ],
  controllers: [HealthController, AuthController, MetricsController],
  providers: [
    // Application command handlers — injected with infrastructure implementations
    {
      provide: RegisterUserHandler,
      inject: [AUTH_REPOSITORY_TOKEN, PASSWORD_HASHER_TOKEN, EVENT_PUBLISHER_TOKEN],
      useFactory: (
        userRepository: unknown,
        passwordHasher: unknown,
        eventPublisher: unknown,
      ) => new RegisterUserHandler(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        userRepository as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        passwordHasher as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        eventPublisher as any,
      ),
    },
    {
      provide: LoginHandler,
      inject: [AUTH_REPOSITORY_TOKEN, PASSWORD_HASHER_TOKEN, TOKEN_SERVICE_TOKEN, REFRESH_TOKEN_REPOSITORY_TOKEN],
      useFactory: (
        userRepository: unknown,
        passwordHasher: unknown,
        tokenService: unknown,
        refreshTokenRepository: unknown,
      ) => new LoginHandler(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        userRepository as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        passwordHasher as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tokenService as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        refreshTokenRepository as any,
      ),
    },
    {
      provide: RefreshTokenHandler,
      inject: [REFRESH_TOKEN_REPOSITORY_TOKEN, AUTH_REPOSITORY_TOKEN, TOKEN_SERVICE_TOKEN],
      useFactory: (
        refreshTokenRepository: unknown,
        userRepository: unknown,
        tokenService: unknown,
      ) => new RefreshTokenHandler(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        refreshTokenRepository as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        userRepository as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tokenService as any,
      ),
    },
    {
      provide: DeactivateUserHandler,
      inject: [AUTH_REPOSITORY_TOKEN, EVENT_PUBLISHER_TOKEN],
      useFactory: (
        userRepository: unknown,
        eventPublisher: unknown,
      ) => new DeactivateUserHandler(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        userRepository as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        eventPublisher as any,
      ),
    },
  ],
})
export class AppModule {}
