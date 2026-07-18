# Proposal: Harden Service Security

## Intent

Apply consistent authentication, authorization, tenant isolation, and security controls across all services.

## Scope

1. **Shared auth library** — extract JwtAuthGuard + RolesGuard + Roles decorator + CurrentUser decorator to `libs/auth-guards/`
2. **Apply guards** — add JwtAuthGuard + RolesGuard to all service controllers
3. **CompanyId scoping** — ensure all queries filter by companyId (from JWT, not request body)
4. **Rate limiting** — add `@nestjs/throttler` to all services
5. **Secure headers** — add `helmet` middleware
6. **Body limits** — configure request body size limits
7. **Tests** — unauthorized, forbidden, cross-tenant access for each service

## Non-goals

- Full RBAC matrix (ADMIN/HR/EMPLOYEE roles only)
- API key auth for machine-to-machine
- Encryption at rest

## Dependencies

- `apps/auth-service` — existing JwtAuthGuard, RolesGuard
- `@nestjs/throttler` — rate limiting
- `helmet` — secure headers
- All service apps
