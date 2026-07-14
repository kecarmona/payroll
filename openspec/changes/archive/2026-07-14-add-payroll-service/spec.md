# Payroll Service Specification

## Purpose

Payroll bounded context — manages payroll periods and orchestrates payroll job lifecycle. Owns `PayrollPeriod` and `PayrollJob` aggregates. Emits `PayrollJobCreated` through the transactional outbox. Never performs individual employee calculations.

## Requirements

### R1: Payroll Service Scaffold

The system MUST provide a NestJS service (port 3003) with ConfigModule, TypeORM for PostgreSQL, global ValidationPipe (`whitelist`, `forbidNonWhitelisted`, `transform`), Swagger docs at `/api`, and a health endpoint at `/health`.

- GIVEN a configured NestJS application module
- WHEN the service starts on port 3003
- THEN `GET /health` returns 200 with status `ok`

### R2: PayrollPeriod Management

The system MUST support creating and listing payroll periods. Each period MUST have: id, companyId, month (1-12), year, startDate, endDate, isClosed (default false), createdAt. The pair (companyId, month, year) MUST be unique.

- GIVEN an ADMIN user for company `X`
- WHEN they create a PayrollPeriod with month=1, year=2026, startDate=2026-01-01, endDate=2026-01-31
- THEN the period is created with isClosed=false
- AND the period appears in the company's period list

- GIVEN an existing period for company `X` in January 2026
- WHEN an ADMIN tries to create another period for the same company, month, and year
- THEN a 409 Conflict is returned

### R3: Create Payroll Job

The system MUST accept `POST /payroll/jobs` with body `{ companyId, payrollPeriodId }` and required headers `Authorization: Bearer <token>` and `Idempotency-Key: <uuid>`. Only HR and ADMIN roles for the target company MAY create jobs. One job per (companyId, payrollPeriodId). Jobs start in `CREATED` state. On success, a `PayrollJobCreated` domain event is recorded in the outbox within the same ACID transaction. The idempotency record (key, requestHash, response) is stored in the same transaction.

- GIVEN an authenticated HR user for company `X`
- AND a PayrollPeriod exists for company `X` in January 2026
- AND no job exists for period `X`-Jan2026
- WHEN they `POST /payroll/jobs` with `{ companyId: "X", payrollPeriodId: "P1" }` and a unique Idempotency-Key
- THEN a PayrollJob is created in `CREATED` state
- AND the response body includes the job ID and status "CREATED"
- AND a row exists in the outbox table with event_type `PayrollJobCreated` and aggregate_id matching the job ID

- GIVEN a job already exists for company `X` and period `P1`
- WHEN a second `POST /payroll/jobs` is sent with the same companyId and payrollPeriodId
- THEN a 409 Conflict is returned with a message explaining the duplicate

- GIVEN a previous successful `POST /payroll/jobs` with Idempotency-Key `K` and payload `{ companyId: "X", payrollPeriodId: "P1" }`
- WHEN the same request is replayed with the same Idempotency-Key and same payload
- THEN the original response is returned (200 with same job ID)

- GIVEN a previous successful `POST /payroll/jobs` with Idempotency-Key `K` and payload `{ companyId: "X", payrollPeriodId: "P1" }`
- WHEN a request is sent with the same Idempotency-Key `K` but different payload `{ companyId: "Y", payrollPeriodId: "P2" }`
- THEN a 409 Conflict is returned

- GIVEN a `POST /payroll/jobs` request without an Idempotency-Key header
- WHEN the request reaches the controller
- THEN a 400 Bad Request is returned

- GIVEN a request with a valid token but EMPLOYEE role
- WHEN they `POST /payroll/jobs`
- THEN a 403 Forbidden is returned

- GIVEN a request with a valid token for company `X`
- WHEN they `POST /payroll/jobs` with a payrollPeriodId that belongs to company `Y`
- THEN a 422 Unprocessable Entity is returned

### R4: PayrollJob State Machine and Queries

The system MUST create PayrollJob in `CREATED` state. The state MUST be queryable by job ID and by (companyId, payrollPeriodId). State transitions to PROCESSING, COMPLETED, FAILED are enforced in a later phase.

- GIVEN a PayrollJob exists with ID `J1`
- WHEN a user queries by `J1`
- THEN the job is returned with status `CREATED`, companyId, payrollPeriodId, createdAt

- GIVEN a PayrollJob exists for company `X` and period `P1`
- WHEN a user queries by (companyId=`X`, payrollPeriodId=`P1`)
- THEN the matching job is returned

### R5: Idempotency Store

The system MUST maintain an `idempotency` table with columns: idempotencyKey (PK), requestHash, responseStatus, responseBody (JSONB), createdAt. Records MUST have a TTL of 24 hours and SHOULD be cleaned periodically. The store MUST be read before command execution and written in the same transaction.

- GIVEN an Idempotency-Key `K` with no prior record
- WHEN the create-job command executes successfully
- THEN a row is inserted with the key, request hash, response status 201, and response body

- GIVEN an Idempotency-Key `K` with an existing record
- WHEN the idempotency check runs before command execution
- THEN the stored response is returned immediately without executing the command

### R6: Transactional Outbox

The system MUST maintain an `outbox` table with columns: id (UUID PK), eventType, aggregateId (UUID), payload (JSONB), createdAt, publishedAt (nullable). Rows MUST be inserted in the same TypeORM transaction as the aggregate write. Phase 8 implements the Kafka publisher.

- GIVEN a PayrollJob is created successfully
- WHEN the transaction commits
- THEN an outbox row exists with eventType=`PayrollJobCreated`, aggregateId=matching job ID, and payload containing companyId, periodId, jobId, timestamp
- AND publishedAt is NULL
