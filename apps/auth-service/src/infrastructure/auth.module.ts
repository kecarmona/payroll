import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmUserEntity } from './persistence/typeorm-user.entity';
import { TypeOrmRefreshTokenEntity } from './persistence/typeorm-refresh-token.entity';
import { TypeOrmUserRepository } from './persistence/typeorm-user.repository';
import { TypeOrmRefreshTokenRepository } from './persistence/typeorm-refresh-token.repository';
import { BcryptPasswordHasher } from './auth/bcrypt-password-hasher';
import { JwtTokenService } from './auth/jwt-token.service';
import { DomainEventPublisherImpl } from './events/domain-event-publisher';

/**
 * Injection tokens for domain port implementations.
 *
 * These string tokens enable NestJS DI to resolve domain port interfaces
 * that are erased at runtime (TypeScript interfaces). Application-layer
 * handlers use `@Inject(token)` to receive the concrete implementation.
 *
 * @example
 * ```ts
 * class RegisterUserHandler {
 *   constructor(
 *     @Inject('UserRepository')
 *     private readonly userRepository: UserRepository,
 *   ) {}
 * }
 * ```
 */
export const AUTH_REPOSITORY_TOKEN = 'UserRepository';
export const REFRESH_TOKEN_REPOSITORY_TOKEN = 'RefreshTokenRepository';
export const PASSWORD_HASHER_TOKEN = 'PasswordHasher';
export const TOKEN_SERVICE_TOKEN = 'TokenService';
export const EVENT_PUBLISHER_TOKEN = 'EventPublisher';

/**
 * NestJS module that wires the infrastructure layer for the Auth Service.
 *
 * Registers TypeORM entities for the `users` and `refresh_tokens` tables,
 * configures the JWT module for token signing, and binds all infrastructure
 * implementations to their domain port interfaces via string injection tokens.
 *
 * ## Provided Bindings
 *
 * | Token | Implementation | Domain Port |
 * |---|---|---|
 * | `'UserRepository'` | {@link TypeOrmUserRepository} | {@link UserRepository} |
 * | `'RefreshTokenRepository'` | {@link TypeOrmRefreshTokenRepository} | {@link RefreshTokenRepository} |
 * | `'PasswordHasher'` | {@link BcryptPasswordHasher} | {@link PasswordHasher} |
 * | `'TokenService'` | {@link JwtTokenService} | {@link TokenService} |
 *
 * ## Usage
 *
 * ```ts
 * // app.module.ts
 * @Module({
 *   imports: [AuthModule],
 * })
 * export class AppModule {}
 * ```
 *
 * ```ts
 * // In a handler or controller:
 * @Injectable()
 * class SomeHandler {
 *   constructor(
 *     @Inject('PasswordHasher')
 *     private readonly hasher: PasswordHasher,
 *   ) {}
 * }
 * ```
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([TypeOrmUserEntity, TypeOrmRefreshTokenEntity]),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  providers: [
    {
      provide: AUTH_REPOSITORY_TOKEN,
      useClass: TypeOrmUserRepository,
    },
    {
      provide: REFRESH_TOKEN_REPOSITORY_TOKEN,
      useClass: TypeOrmRefreshTokenRepository,
    },
    {
      provide: PASSWORD_HASHER_TOKEN,
      useClass: BcryptPasswordHasher,
    },
    {
      provide: TOKEN_SERVICE_TOKEN,
      useClass: JwtTokenService,
    },
    {
      provide: EVENT_PUBLISHER_TOKEN,
      useClass: DomainEventPublisherImpl,
    },
  ],
  exports: [
    AUTH_REPOSITORY_TOKEN,
    REFRESH_TOKEN_REPOSITORY_TOKEN,
    PASSWORD_HASHER_TOKEN,
    TOKEN_SERVICE_TOKEN,
    EVENT_PUBLISHER_TOKEN,
  ],
})
export class AuthModule {}
