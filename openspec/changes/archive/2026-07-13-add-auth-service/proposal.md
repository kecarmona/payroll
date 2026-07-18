# Proposal: Auth Service

## Intent

Add the identity and access bounded context — user registration, password-based authentication, JWT issuance, RBAC, and refresh token rotation. Every external request enters through this service; without it, no other service can authenticate callers.

## Scope

### In Scope
- `User` aggregate (UserId, email, hashed password, roles, companyId, isActive, optimistic lock)
- `RefreshToken` entity with rotation (stored hashed, one-use, versioned)
- Register, login, refresh token, deactivate commands/handlers
- `AuthController` — POST `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/deactivate`
- JWT guard (extracts & validates token) + Roles guard (checks role claims)
- `CurrentUser` parameter decorator
- TypeORM PostgreSQL repositories + migration
- Bcrypt password hasher (port in domain, impl in infra)
- JWT token service using `@nestjs/jwt` (HS256, configurable secret)
- Unit tests (domain rules, value objects), integration tests (repositories via testcontainers), E2E (login flow, RBAC)

### Out of Scope
- Idempotency-Key support (deferred to hardening phase)
- Event publishing via outbox (UserRegistered etc. go through EventPublisher port; Kafka publishing deferred)
- Rate limiting (applied at API gateway level)
- OAuth / SSO / social login
- Password reset flow
- Multi-factor authentication

## Capabilities

### New Capabilities
- `auth-service`: Authentication, authorization, user & refresh token management for the payroll platform

### Modified Capabilities
- None

## Approach

Clean Architecture with NestJS:

1. **Domain** (`domain/`): `User` aggregate extends `AggregateRoot`; value objects `UserId`, `UserEmail`, `Password` (hash port interface); `UserRole` enum; `RefreshToken` entity; identity domain events (types already in `libs/contracts`); `PasswordHasher` and `TokenService` port interfaces.
2. **Application** (`application/`): CQRS-style command classes with handlers — `RegisterUserCommand`, `LoginCommand`, `RefreshTokenCommand`, `DeactivateUserCommand`. Each handler depends on domain ports only.
3. **Interface** (`interface/`): `AuthController`, DTOs with class-validator, `JwtAuthGuard`, `RolesGuard`, `CurrentUser` decorator.
4. **Infrastructure** (`infrastructure/`): `TypeormUserRepository`, `TypeormRefreshTokenRepository`, `BcryptPasswordHasher`, `JwtTokenService`. PostgreSQL entities + migration.

Reuses `service-foundation` modules (ConfigModule, ValidationPipe, ExceptionFilter, etc.).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `apps/auth-service/src/domain/` | New | Aggregate, VOs, events, port interfaces |
| `apps/auth-service/src/application/` | New | Commands and handlers |
| `apps/auth-service/src/interface/` | New | Controller, guards, decorator, DTOs |
| `apps/auth-service/src/infrastructure/` | New | Repositories, hasher, token service |
| `apps/auth-service/src/infrastructure/persistence/migrations/` | New | PostgreSQL migration |
| `apps/auth-service/test/` | New | Unit, integration, E2E tests |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Password hash algorithm changes (bcrypt rounds) | Low | Configurable via env, default 12 |
| JWT secret rotation without downtime | Medium | Support multiple valid secrets via config array |
| Refresh token replay | Low | Stored hashed, rotated on use, old token invalidated |

## Rollback Plan

Revert the migration (`DROP TABLE users, refresh_tokens CASCADE`), remove the auth service module registration from infra compose (no other service depends on auth yet), and restore git state. No data loss risk — this is the first auth deploy.

## Dependencies

- `libs/shared-kernel` (AggregateRoot, Id, DomainError)
- `libs/contracts` (IdentityEventType constants — already defined)
- `libs/service-foundation` (ConfigModule, ValidationPipe, ExceptionFilter)
- `@nestjs/jwt`, `bcrypt` (or `bcryptjs`), `@nestjs/typeorm`, `typeorm`, `pg`
- Docker PostgreSQL instance (port 5432)

## Success Criteria

- [ ] `POST /auth/register` creates user and returns tokens
- [ ] `POST /auth/login` validates credentials and returns JWT + refresh token
- [ ] `POST /auth/refresh` rotates refresh token and issues new tokens
- [ ] `POST /auth/deactivate` soft-deactivates user
- [ ] Protected routes return 401 without valid JWT
- [ ] RBAC returns 403 when role insufficient
- [ ] All domain tests pass (email format, password hashing, role assignment)
- [ ] Integration tests pass (repository + PostgreSQL via testcontainers)
- [ ] E2E login + protected route + token refresh flow passes
