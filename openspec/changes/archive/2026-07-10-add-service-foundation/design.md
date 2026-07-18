# Design: Shared Service Foundation Library

## Technical Approach

Create `libs/service-foundation/` — an opt-in NestJS library with 5 independent `DynamicModule` capabilities (config, validation, logging, health, error handling). Each module is `.forRoot()` importable so services pull only what they need. Extend `libs/testing/` with reusable test factories. Wire path alias `@payroll/service-foundation` in tsconfig.

## Architecture Decisions

| Option | Tradeoffs | Decision |
|--------|-----------|----------|
| **DynamicModule vs static Module** | Static is simpler but forces all services into the same config. DynamicModule allows `forRoot({ schema?, serviceName? })` — each service passes its own params. | **DynamicModule** — proposal requires opt-in per-service. |
| **NestJS Logger vs pino/bunyan** | NestJS Logger is built-in, no extra dep. pino has better perf and structured JSON. Roadmap may swap later. | **NestJS Logger wrapper** — start simple, swap via adapter later (proposal risk item). |
| **AsyncLocalStorage vs Request-scoped provider** | Request-scoped provider couples to NestJS DI scope (each request instantiates dependents). ALS is framework-transparent and works with `LoggerService` without making it request-scoped. | **AsyncLocalStorage** — cleaner separation; `CorrelationIdMiddleware` stores, `LoggerService` reads via ALS. |
| **@nestjs/config + Joi vs custom ConfigService** | Custom ConfigService gives full control but duplicates env parsing that `@nestjs/config` already does well. Joi is already an accepted dependency via `@nestjs/config`. | **@nestjs/config + Joi** — standard NestJS pattern, fail-fast validation, minimal new surface. |
| **Separate `/health` controller vs merged into service** | Merged means every service duplicates health logic. Separate module provides consistent `{status, timestamp, uptime}` across all 8 services. | **HealthModule** — pluggable indicators, single `GET /health` endpoint. |

## Data Flow

```
Request ──→ CorrelationIdMiddleware ──→ Controller ──→ Service ──→ Logger
                 │                      │                           ↑
            AsyncLocalStorage     ValidationPipe              reads correlationId
            stores x-correlation-id   │                    from AsyncLocalStorage
                                 rejects bad DTOs
                                    (400)

Exception ──→ GlobalExceptionFilter ──→ { statusCode, error, message, correlationId, timestamp }
                                                 ↑
                                          maps DomainError → HTTP codes

Startup ──→ ConfigModule.forRoot() ──→ Joi validation ──→ typed config available
                                              │
                                    fail-fast if env missing
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `libs/service-foundation/src/lib/config/config.module.ts` | Create | `DynamicModule.forRoot({ schema? })`, wraps `@nestjs/config` + Joi |
| `libs/service-foundation/src/lib/config/app-config.interface.ts` | Create | `AppConfig`, `DatabaseConfig`, `KafkaConfig` typed interfaces |
| `libs/service-foundation/src/lib/config/env.validation.ts` | Create | Joi schema for core env vars (`NODE_ENV`, `PORT`, `SERVICE_NAME`) |
| `libs/service-foundation/src/lib/validation/validation.provider.ts` | Create | `createValidationPipe()` factory — whitelist, forbidNonWhitelisted, transform |
| `libs/service-foundation/src/lib/logger/logger.module.ts` | Create | `DynamicModule.forRoot({ serviceName })` |
| `libs/service-foundation/src/lib/logger/logger.service.ts` | Create | StructuredLogger wrapping NestJS Logger — JSON output with correlationId |
| `libs/service-foundation/src/lib/logger/correlation-id.middleware.ts` | Create | NestMiddleware — reads `x-correlation-id` header, generates UUIDv4 if absent, stores in ALS. Exports `CORRELATION_ID_TOKEN` |
| `libs/service-foundation/src/lib/health/health.module.ts` | Create | Registers `/health` — `{ status, timestamp, uptime }`, optional indicators |
| `libs/service-foundation/src/lib/filters/global-exception.filter.ts` | Create | `AllExceptionsFilter` — catches HttpException, DomainError (→400/404), generic Error (→500) |
| `libs/service-foundation/src/lib/index.ts` | Create | Barrel exports for all modules |
| `libs/service-foundation/src/index.ts` | Create | Re-exports from `./lib` |
| `libs/testing/src/lib/test-config.ts` | Create | `createTestingConfig()` — returns valid config objects without env vars |
| `libs/testing/src/lib/mock-correlation-id.ts` | Create | `MockCorrelationIdProvider` — returns fixed correlation ID |
| `libs/testing/src/index.ts` | Modify | Add exports for new test utilities |
| `tsconfig.base.json` | Modify | Add `@payroll/service-foundation` path alias |

## Interfaces / Contracts

```typescript
// Core config interfaces
interface AppConfig {
  nodeEnv: string;
  port: number;
  serviceName: string;
}
interface DatabaseConfig { host: string; port: number; database: string; }
interface KafkaConfig { brokers: string[]; clientId: string; }

// Correlation ID token
const CORRELATION_ID_TOKEN = Symbol('CORRELATION_ID');

// Error response shape (returned by exception filter)
interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  correlationId: string;
  timestamp: string;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | ConfigModule — env validation rejects bad vars | `Test.createTestingModule`, mock `process.env` |
| Unit | ValidationPipe — rejects extra DTO fields | Direct pipe invocation with test DTO |
| Unit | LoggerService — JSON output includes correlationId + serviceName | Spy on `Logger.log()`, assert JSON fields |
| Unit | CorrelationIdMiddleware — stores header vs generates UUID | Simulate `req.headers`, check ALS value |
| Unit | HealthModule — returns `{status, timestamp, uptime}` | HTTP test via `supertest` |
| Unit | ExceptionFilter — maps DomainError to HTTP codes | Mock `HttpArgumentsHost`, assert response shape |
| Unit | Test utilities — createTestingConfig returns valid objects | Assert returned objects match typed interfaces |
| Integration | ConfigModule + ValidationPipe loading | `Test.createTestingModule` with both modules, verify full NestJS initialization |

## Migration / Rollout

No migration required. This is new infrastructure. Services adopt it incrementally by importing the modules they need in later SDD changes.

## Open Questions

- None — design is fully scoped per proposal and spec.
