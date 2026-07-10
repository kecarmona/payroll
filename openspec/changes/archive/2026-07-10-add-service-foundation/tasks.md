# Tasks: add-service-foundation

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 600–800 |
| 800-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Medium

## Phase 0: Library Scaffold

- [x] 0.1 Generate `libs/service-foundation` via `nx g @nx/nest:lib service-foundation --directory=libs --no-interactive`
- [x] 0.2 Add `@payroll/service-foundation` path alias in `tsconfig.base.json`

## Phase 1: Correlation ID

- [x] 1.1 Create `logger/correlation-id.middleware.ts` — reads `x-correlation-id`, generates UUIDv4, stores in AsyncLocalStorage
- [x] 1.2 Create `logger/correlation-id.module.ts` — exports CORRELATION_ID_TOKEN + ALS accessor
- [x] 1.3 Write spec: header preserved, missing header generates UUID

## Phase 2: Structured Logger

- [x] 2.1 Create `logger/logger.service.ts` — wraps NestJS Logger, JSON output with timestamp/level/message/correlationId/serviceName/context
- [x] 2.2 Create `logger/logger.module.ts` — DynamicModule.forRoot({ serviceName })
- [x] 2.3 Write spec: log entry includes all fields, missing correlationId uses "-"

## Phase 3: Config Module

- [x] 3.1 Create `config/app-config.interface.ts` — AppConfig, DatabaseConfig, KafkaConfig
- [x] 3.2 Create `config/env.validation.ts` — Joi schema for NODE_ENV, PORT, SERVICE_NAME, DATABASE_URL, REDIS_URL, KAFKA_BROKERS
- [x] 3.3 Create `config/config.module.ts` — DynamicModule.forRoot({ schema? })
- [x] 3.4 Write spec: valid env loads, missing required var fails fast

## Phase 4: Validation Pipe

- [x] 4.1 Create `validation/validation.provider.ts` — createValidationPipe() with whitelist/forbidNonWhitelisted/transform
- [x] 4.2 Write spec: extra fields rejected, invalid DTO field returns 400

## Phase 5: Health Module

- [x] 5.1 Create `health/health.module.ts` + `health.controller.ts` — GET /health returns { status, timestamp, uptime }
- [x] 5.2 Write spec: healthy returns 200, unhealthy dependency returns 503

## Phase 6: Exception Filter

- [x] 6.1 Create `filters/global-exception.filter.ts` — maps DomainError→400, NotFoundError→404, unknown→500
- [x] 6.2 Write spec: ValidationError→400, NotFoundError→404, unknown→500

## Phase 7: Testing Utilities

- [x] 7.1 Create `libs/testing/src/lib/test-config.ts` — createTestingConfig() without real env vars
- [x] 7.2 Create `libs/testing/src/lib/mock-correlation-id.ts` — MockCorrelationIdProvider with fixed ID
- [x] 7.3 Update `libs/testing/src/index.ts` — export new utilities

## Phase 8: Wiring

- [x] 8.1 Create `libs/service-foundation/src/index.ts` — barrel export all modules
- [x] 8.2 Verify: `nx test service-foundation`, `nx build service-foundation`, `nx lint service-foundation`

## Phase 9: Documentation

- [x] 9.1 Update `docs/09-tracking/implementation-roadmap.md` with completed milestones
