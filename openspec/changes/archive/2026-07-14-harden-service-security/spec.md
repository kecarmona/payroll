# Spec: Harden Service Security

## 1. Shared Auth Library (`libs/auth-guards/`)

Extract from auth-service:
- `jwt-auth.guard.ts` — validates JWT token, attaches user to request
- `roles.guard.ts` — checks required roles from `@Roles()` decorator
- `roles.decorator.ts` — sets required role metadata
- `current-user.decorator.ts` — extracts user from request

### Port interface

The guard should verify the JWT using a shared secret (env var `JWT_SECRET`).
This means each service needs `@nestjs/jwt` or the guard needs to accept a verify function.

Better approach: make the guard accept a `secretOrPublicKey` config so each service can verify JWTs independently without calling auth-service.

## 2. Apply to Services

### Employee Service
- Apply JwtAuthGuard + RolesGuard to all endpoints
- Require HR or ADMIN for write operations
- Allow EMPLOYEE to read own data
- CompanyId scoping: filter by companyId from JWT

### Payroll Service
- Apply JwtAuthGuard + RolesGuard to all endpoints
- Require HR or ADMIN for payroll operations
- CompanyId scoping

### Projection Service
- Apply JwtAuthGuard to all endpoints
- CompanyId scoping (already done via query param)

## 3. Rate Limiting

- Add `@nestjs/throttler` to all services
- Default: 10 requests/second per IP
- Auth endpoints (login/register): 5 requests/minute per IP

## 4. Secure Headers + Body Limits

- Add `helmet` middleware to all services
- Set body limit to 1MB via NestJS `bodyParser` config

## Acceptance Criteria

1. Unauthenticated requests return 401
2. Unauthorized role returns 403
3. Cross-tenant access returns 403 or empty results
4. Rate limit exceeded returns 429
5. Secure headers present in all responses
6. All existing tests still pass
