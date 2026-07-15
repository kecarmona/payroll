# Tasks: Harden Service Security

## Phase 1: Shared Auth Library

- [x] 1.1 Generate `libs/auth-guards/` via Nx
- [x] 1.2 Extract `jwt-auth.guard.ts` from auth-service
- [x] 1.3 Extract `roles.guard.ts` from auth-service
- [x] 1.4 Extract `roles.decorator.ts` from auth-service
- [x] 1.5 Extract `current-user.decorator.ts` from auth-service
- [x] 1.6 Create `auth-guards.module.ts`
- [x] 1.7 Write unit tests for all guards
- [x] 1.8 Update auth-service to use shared guards
- [x] 1.9 Build + lint libs/auth-guards

## Phase 2: Apply Security to Employee Service

- [x] 2.1 Install @nestjs/jwt, @nestjs/throttler, helmet
- [x] 2.2 Add JwtAuthGuard + RolesGuard to all endpoints
- [ ] 2.3 Add companyId scoping from JWT
- [x] 2.4 Add ThrottlerModule
- [x] 2.5 Add helmet middleware
- [ ] 2.6 Add bodyParser limit
- [ ] 2.7 Add unauthorized/forbidden/cross-tenant tests
- [x] 2.8 All existing tests still pass

## Phase 3: Apply Security to Payroll Service

- [x] 3.1 Add JwtAuthGuard + RolesGuard to all endpoints
- [ ] 3.2 Add companyId scoping from JWT
- [x] 3.3 Add ThrottlerModule
- [x] 3.4 Add helmet middleware
- [ ] 3.5 Add bodyParser limit
- [ ] 3.6 Add unauthorized/forbidden/cross-tenant tests
- [x] 3.7 All existing tests still pass

## Phase 4: Apply Security to Projection Service

- [x] 4.1 Add JwtAuthGuard to all endpoints
- [ ] 4.2 Add companyId scoping from JWT
- [x] 4.3 Add ThrottlerModule
- [x] 4.4 Add helmet middleware
- [ ] 4.5 Add bodyParser limit
- [ ] 4.6 Add unauthorized/forbidden/cross-tenant tests
- [x] 4.7 All existing tests still pass

## Phase 5: Verify

- [x] 5.1 Run all tests across all services
- [x] 5.2 Build all services
- [x] 5.3 Lint all services

## Phase 6: Roadmap

- [ ] 6.1 Update `docs/09-tracking/implementation-roadmap.md` — mark Phase 13 complete
