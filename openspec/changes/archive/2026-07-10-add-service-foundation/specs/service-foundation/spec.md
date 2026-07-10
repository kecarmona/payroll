# Service Foundation Specification

## Purpose

Opt-in NestJS infrastructure modules shared across all 8 services — config, validation, logging, correlation IDs, health checks, error handling, and test utilities. Each module is independently importable via `DynamicModule.forRoot()` / `.register()`.

## ADDED Requirements

### Requirement: ConfigModule loads and validates environment variables

The **ConfigModule** MUST load env vars via `@nestjs/config` with Joi schema validation. Startup MUST fail fast when required vars are missing or malformed. Typed config objects (`DatabaseConfig`, `KafkaConfig`, `AppConfig`) SHOULD be exposed via a dedicated provider token.

#### Scenario: Valid env vars load successfully

- GIVEN all required env vars are present with valid values
- WHEN the application starts with `ConfigModule.forRoot()`
- THEN the module initializes and typed config objects are available for injection

#### Scenario: Missing required env var fails fast

- GIVEN a required env var (e.g. `DATABASE_URL`) is not set
- WHEN the application starts with `ConfigModule.forRoot()`
- THEN NestJS startup fails with a clear error message indicating which var is missing

### Requirement: ValidationPipe rejects malformed DTOs

The **ValidationPipe** MUST be configured with `whitelist: true`, `forbidNonWhitelisted: true`, and `transform: true`. A factory function SHOULD create the pipe with these defaults.

#### Scenario: Extra fields are rejected

- GIVEN a DTO class without a `name` property
- WHEN a request body includes `{ name: "extra", validField: "ok" }`
- THEN the pipe rejects with a 400 Bad Request and an error listing `name` as not allowed

#### Scenario: Invalid DTO field value

- GIVEN a DTO with `@IsInt()` on `count`
- WHEN a request body includes `{ count: "not-a-number" }`
- THEN the pipe rejects with a 400 response containing validation error messages

### Requirement: Structured Logger includes correlation ID and service name

The **Logger** service MUST extend NestJS `Logger` (or provide a compatible interface) and output JSON-structured entries. Every log call MUST include `timestamp`, `level`, `message`, `correlationId`, and `serviceName`. When no correlation ID is available, `"-"` MUST be used as placeholder.

#### Scenario: Log entry includes context fields

- GIVEN a logger instance configured with `serviceName: "auth-service"`
- WHEN `logger.log("User created", "UserService")` is called
- THEN the output is a JSON object with fields `timestamp`, `level`, `message: "User created"`, `correlationId`, `serviceName: "auth-service"`, and `context: "UserService"`

#### Scenario: Missing correlation ID uses placeholder

- GIVEN no correlation ID is set in the current context
- WHEN `logger.warn("Degraded performance")` is called
- THEN the output includes `correlationId: "-"`

### Requirement: Correlation ID middleware propagates request context

A NestJS middleware MUST read the `x-correlation-id` header from incoming HTTP requests. If absent, it MUST generate a UUID v4. The value MUST be stored in `AsyncLocalStorage` and accessible via a `@Inject(CORRELATION_ID_TOKEN)` decorator or a dedicated `@CorrelationId()` parameter decorator.

#### Scenario: Header value is preserved

- GIVEN an incoming request with header `x-correlation-id: abc-123`
- WHEN the middleware processes the request
- THEN `abc-123` is stored in `AsyncLocalStorage` and accessible via the correlation ID decorator throughout the request lifecycle

#### Scenario: Missing header generates UUID

- GIVEN an incoming request WITHOUT an `x-correlation-id` header
- WHEN the middleware processes the request
- THEN a new UUID v4 is generated, stored in `AsyncLocalStorage`, and used for that request

### Requirement: Health module returns service status

The **HealthModule** MUST expose `GET /health` returning `{ status, timestamp, uptime }`. The endpoint SHOULD support pluggable health indicators (database, Kafka). Status MUST be `"ok"` (200) when all indicators pass and `"error"` (503) when any dependency is unhealthy.

#### Scenario: All dependencies healthy

- GIVEN all health indicators report healthy
- WHEN `GET /health` is called
- THEN the response is 200 with `{ status: "ok", timestamp: "<ISO string>", uptime: "<seconds>" }`

#### Scenario: Dependency is unhealthy

- GIVEN the database health indicator reports unhealthy
- WHEN `GET /health` is called
- THEN the response is 503 with `status: "error"` and details about the failing dependency

### Requirement: Global exception filter returns consistent error format

The **GlobalExceptionFilter** MUST catch all unhandled exceptions and return `{ statusCode, error, message, correlationId, timestamp }`. Domain errors MUST map to appropriate HTTP statuses: `ValidationError` → 400, `NotFoundError` → 404. Unknown errors MUST return 500.

#### Scenario: Domain ValidationError returns 400

- GIVEN a service throws `new ValidationError("Email is required")`
- WHEN the exception filter catches it
- THEN the response is 400 with `{ statusCode: 400, error: "ValidationError", message: "Email is required", correlationId: "…", timestamp: "…" }`

#### Scenario: Domain NotFoundError returns 404

- GIVEN a service throws `new NotFoundError("Employee", "id-42")`
- WHEN the exception filter catches it
- THEN the response is 404 with `{ statusCode: 404, error: "NotFoundError", message: "Employee id-42 not found" }`

#### Scenario: Unknown error returns 500

- GIVEN an unhandled runtime error
- WHEN the exception filter catches it
- THEN the response is 500 with `{ statusCode: 500, error: "Internal Server Error", message: "An unexpected error occurred" }`

### Requirement: Test utilities support isolated unit testing

`libs/testing/` MUST provide `createTestingConfig()` that returns valid config objects without env vars and a `MockCorrelationIdProvider` that returns a fixed correlation ID for test assertions. A helper for stubbing database modules SHOULD be available.

#### Scenario: Test config loads without real env vars

- GIVEN a test that calls `createTestingConfig()`
- WHEN the config is injected into a service
- THEN the service receives valid `DatabaseConfig`, `KafkaConfig`, and `AppConfig` objects without reading actual environment variables

#### Scenario: Mock correlation ID enables deterministic assertions

- GIVEN a test configured with `MockCorrelationIdProvider("fixed-id")`
- WHEN the service under test logs a message
- THEN every log entry contains `correlationId: "fixed-id"`
