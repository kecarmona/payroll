# Design: Auth Service

## Technical Approach

Clean Architecture auth service — `User` aggregate and `RefreshToken` entity, each in its own aggregate boundary. Commands flow through handlers that depend only on domain port interfaces. NestJS wires infrastructure (TypeORM, bcrypt, JWT) at the edges. Event publishing goes through the `EventPublisher` port; the first impl is in-memory (Kafka/outbox deferred to hardening).

## Architecture Decisions

### Decision: Two separate aggregates (User + RefreshToken)

| Option | Tradeoff | Decision |
|--------|----------|----------|
| RefreshToken as User child collection | Loading User loads all tokens; can't GC expired tokens independently | ❌ |
| Separate aggregate per token group | User handles credentials, tokens are self-contained; GC-friendly; finer-grained locking | ✅ |

### Decision: Password hasher as domain port

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Hash directly in User entity | Couples domain to bcrypt; can't test hash logic in isolation | ❌ |
| `PasswordHasher` interface + impl in infra | Domain depends only on the abstraction; swap impl without touching domain | ✅ |

### Decision: Refresh token theft detection

Old token is NOT deleted — marked `isRevoked=true`. If a revoked token is reused (attacker vs. legitimate user), ALL user sessions are revoked. This is a spec-level requirement.

### Decision: Use `IdentityEventType` constants from contracts lib

No duplicate event type strings. Domain events implement `DomainEvent` interface with `eventType` from `IdentityEventType` constants.

## Data Flow

```
POST /auth/register
  Controller → RegisterUserCommand → Handler
    → UserRepository.save(new User(...))
    → EventPublisher.publish(UserRegistered)
    → JwtTokenService.issue() → TokenResponse

POST /auth/login
  Controller → LoginCommand → Handler
    → UserRepository.findByEmail(email)
    → PasswordHasher.verify(plain, hash)
    → JwtTokenService.issue() → TokenResponse
    → RefreshTokenRepository.save(new RefreshToken(...))

POST /auth/refresh
  Controller → RefreshTokenCommand → Handler
    → RefreshTokenRepository.findByTokenHash(hash)
    → assert not revoked, not expired
    → RefreshTokenRepository.revokeAllForUser(userId) if theft detected
    → Issue new tokens, new refresh token record

POST /auth/deactivate
  Controller → DeactivateUserCommand → Handler
    → UserRepository.findById(id)
    → user.deactivate() → records UserDeactivated event
    → UserRepository.save(user)
    → EventPublisher.publish(UserDeactivated)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `apps/auth-service/src/domain/user-id.ts` | Create | Extends `Id<'UserId'>` |
| `apps/auth-service/src/domain/user-email.ts` | Create | ValueObject with email validation |
| `apps/auth-service/src/domain/user-role.ts` | Create | Enum: ADMIN, HR, EMPLOYEE |
| `apps/auth-service/src/domain/password.ts` | Create | ValueObject wrapping hashed string |
| `apps/auth-service/src/domain/user.entity.ts` | Create | AggregateRoot — email, passwordHash, role, isActive |
| `apps/auth-service/src/domain/refresh-token.entity.ts` | Create | Entity — tokenHash, expiresAt, isRevoked, userId |
| `apps/auth-service/src/domain/password-hasher.ts` | Create | Port: `hash(password)`, `verify(plain, hash)` |
| `apps/auth-service/src/domain/user.repository.ts` | Create | Port: `save`, `findById`, `findByEmail` |
| `apps/auth-service/src/domain/refresh-token.repository.ts` | Create | Port: `save`, `findByTokenHash`, `revokeAllForUser` |
| `apps/auth-service/src/domain/events/user-registered.event.ts` | Create | DomainEvent payload |
| `apps/auth-service/src/domain/events/user-deactivated.event.ts` | Create | DomainEvent payload |
| `apps/auth-service/src/application/register-user.command.ts` | Create | Command + Handler |
| `apps/auth-service/src/application/login.command.ts` | Create | Command + Handler |
| `apps/auth-service/src/application/refresh-token.command.ts` | Create | Command + Handler |
| `apps/auth-service/src/application/deactivate-user.command.ts` | Create | Command + Handler |
| `apps/auth-service/src/interface/auth.controller.ts` | Create | REST controller, 4 endpoints |
| `apps/auth-service/src/interface/dto/*.ts` | Create | 4 DTOs with class-validator |
| `apps/auth-service/src/interface/guards/jwt-auth.guard.ts` | Create | Extracts + validates JWT |
| `apps/auth-service/src/interface/guards/roles.guard.ts` | Create | Checks @Roles() metadata |
| `apps/auth-service/src/interface/decorators/current-user.decorator.ts` | Create | Param decorator |
| `apps/auth-service/src/infrastructure/persistence/typeorm-user.entity.ts` | Create | TypeORM @Entity mapping |
| `apps/auth-service/src/infrastructure/persistence/typeorm-refresh-token.entity.ts` | Create | TypeORM @Entity mapping |
| `apps/auth-service/src/infrastructure/persistence/typeorm-user.repository.ts` | Create | Implements UserRepository |
| `apps/auth-service/src/infrastructure/persistence/typeorm-refresh-token.repository.ts` | Create | Implements RefreshTokenRepository |
| `apps/auth-service/src/infrastructure/auth/bcrypt-password-hasher.ts` | Create | bcrypt 12 rounds |
| `apps/auth-service/src/infrastructure/auth/jwt-token.service.ts` | Create | @nestjs/jwt wrapper |
| `apps/auth-service/src/infrastructure/auth.module.ts` | Create | NestJS module wiring |
| `apps/auth-service/src/app.module.ts` | Modify | Import AuthModule + service-foundation |
| `apps/auth-service/src/main.ts` | Modify | Add GlobalExceptionFilter |
| `apps/auth-service/test/unit/domain/*.spec.ts` | Create | User, Password, UserEmail tests |
| `apps/auth-service/test/unit/application/*.spec.ts` | Create | Command handler tests |
| `apps/auth-service/test/integration/*.spec.ts` | Create | Repository tests |

## Interfaces / Contracts

```typescript
// Domain event payloads
interface UserRegisteredPayload {
  userId: string;
  email: string;
  role: UserRole;
  companyId: string;
}

interface UserDeactivatedPayload {
  userId: string;
  companyId: string;
}

// JWT payload (decoded)
interface JwtPayload {
  sub: string;       // userId
  email: string;
  roles: UserRole[];
  companyId: string;
  iat: number;
  exp: number;
}

// Token response
interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | User aggregate rules (deactivate idempotent, email validation, role assignment) | Pure domain, no infra |
| Unit | Password value object equality, guard against empty | Pure domain |
| Unit | Command handlers (mock repos + hasher) | Mock domain ports |
| Unit | JwtAuthGuard (valid token, expired, missing) | NestJS TestingModule |
| Unit | RolesGuard (matches, mismatch) | NestJS TestingModule |
| Integration | TypeORM repositories (CRUD, findByEmail, revokeAllForUser) | Testcontainers PostgreSQL |
| E2E | Full login → protected route → refresh → deactivate flow | supertest + running app |

## Migration / Rollout

No migration required for initial deploy. TypeORM `synchronize: true` for dev; dedicated migration file for production.

## Open Questions

- [ ] None
