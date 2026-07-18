# Proposal: add-service-foundation

## Intent

Each service scaffold has `main.ts` and `app.module.ts` but zero shared NestJS infrastructure. Every service would independently reinvent config loading, validation, logging, error handling, health checks, and correlation ID plumbing. This change provides opt-in, reusable NestJS modules so all 8 services share a consistent foundation.

## Scope

### In Scope
- Shared typed config module with env validation (fail-fast on startup)
- Global ValidationPipe factory (whitelist, forbidNonWhitelisted, transform)
- Structured JSON logger with correlation ID and service name context
- Correlation ID middleware (read from header or generate UUID, propagate via DI)
- Reusable health check module with pluggable indicators
- Global exception filter with consistent `{ statusCode, error, message, correlationId, timestamp }` response
- Testing utilities: test config factory, mock correlation ID provider, test DB module helper

### Out of Scope
- Kafka consumer/producer correlation ID propagation (deferred to add-event-bus-implementation)
- Per-service health check customization (addressed per-service in later changes)
- OpenTelemetry or distributed tracing integration
- Audit-logging integration

## Capabilities

### New Capabilities
- `service-config`: Typed env-var loading with Joi/class-validator, fail-fast validation
- `service-validation`: Pre-configured ValidationPipe factory
- `service-logging`: Structured JSON logger + correlation ID middleware + DI token
- `service-observability`: Reusable health check module + global exception filter
- `service-testing`: Shared test factories (config, correlation ID, DB module stub)

### Modified Capabilities
None

## Approach

Create a new `libs/service-foundation/` with 5 NestJS modules (one per capability) under `src/infrastructure/` to keep NestJS deps out of domain. Each module is a `DynamicModule` with `.register()` / `.forRoot()` for opt-in usage. Services import only what they need.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `libs/service-foundation/` | New | Shared NestJS foundation library |
| `libs/testing/` | Modified | Add test config factory, mock correlation ID, DB helper |
| `libs/service-foundation/src/infrastructure/` | New | Config, validation, logger, health, error filter modules |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Over-engineering patterns for future needs | Low | Build only what roadmap services need now |
| Config coupling — all services forced into one schema | Low | Each module is opt-in `DynamicModule` |
| Logger choice (pino vs NestJS Logger) becomes blocking | Low | Start with NestJS Logger wrapper; swap to pino later via adapter |

## Rollback Plan

Remove the `ServiceFoundationModule` import from any service that added it. Delete `libs/service-foundation/` directory and revert `libs/testing/` additions. No data migration needed — pure infrastructure code.

## Dependencies

- NestJS 10 (`@nestjs/common`, `@nestjs/config`, `@nestjs/terminus` for health)
- `class-validator`, `class-transformer` (already in project)
- `uuid` for correlation ID generation
- No external logging library yet — use NestJS Logger wrapper

## Success Criteria

- [ ] All 8 services can import `ServiceFoundationModule` and get typed config from env
- [ ] Validation pipe rejects extra fields with 400 + consistent response shape
- [ ] Logger output includes `correlationId` and `serviceName` in every entry
- [ ] Correlation ID flows through middleware and is injectable
- [ ] `GET /health` returns 200 with service status
- [ ] All exceptions return `{ statusCode, error, message, correlationId, timestamp }`
- [ ] Test utilities work in at least one service's unit test suite
