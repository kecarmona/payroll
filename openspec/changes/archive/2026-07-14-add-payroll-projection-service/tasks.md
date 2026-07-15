# Tasks: Add Payroll Projection Service

## Phase 1: Service Scaffold

- [x] 1.1 Generate `apps/payroll-projection-service/` via Nx generator
- [x] 1.2 Add Mongoose dependency (`@nestjs/mongoose`, `mongoose`)
- [x] 1.3 Add tsconfig paths, jest config, project.json targets
- [x] 1.4 Add service-foundation modules

## Phase 2: MongoDB Schemas

- [x] 2.1 `infrastructure/mongoose/payroll-job.schema.ts` — Mongoose schema + model
- [x] 2.2 `infrastructure/mongoose/payroll-transaction.schema.ts`
- [x] 2.3 `infrastructure/mongoose/payslip.schema.ts`
- [x] 2.4 Unit tests for schema validation

## Phase 3: Projection Handlers

- [x] 3.1 `application/handlers/payroll-job.handler.ts` — handle PayrollJobCreated
- [x] 3.2 `application/handlers/transaction.handler.ts` — handle Completed/Failed
- [x] 3.3 `application/handlers/payslip.handler.ts` — handle PayslipGenerated
- [x] 3.4 `application/idempotency.service.ts` — dedup by lastEventId
- [x] 3.5 Unit tests for all handlers

## Phase 4: REST Controllers

- [x] 4.1 `interface/controllers/jobs.controller.ts` — GET /api/projections/jobs
- [x] 4.2 `interface/controllers/transactions.controller.ts` — GET by jobId
- [x] 4.3 `interface/controllers/payslips.controller.ts` — GET by employeeId or payslipId
- [x] 4.4 DTOs for query responses
- [x] 4.5 Unit tests for controllers

## Phase 5: Wiring

- [x] 5.1 `app.module.ts` — MongooseModule, Kafka consumer, controllers
- [x] 5.2 `main.ts` — bootstrap, Swagger, health check

## Phase 6: Verify

- [x] 6.1 `nx test payroll-projection-service` — all tests pass
- [x] 6.2 `nx build payroll-projection-service` — clean build
- [x] 6.3 `nx lint payroll-projection-service` — 0 errors

## Phase 7: Roadmap

- [ ] 7.1 Update `docs/09-tracking/implementation-roadmap.md` — mark Phase 10 complete
