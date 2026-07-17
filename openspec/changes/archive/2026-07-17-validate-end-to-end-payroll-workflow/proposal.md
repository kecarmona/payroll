# Proposal: Validate End-to-End Payroll Workflow

## Intent

Prove the core payroll flow works across all 8 microservices before Phase 16. Async Kafka, idempotency, projections, and audit are untested as a chain — each service was validated in isolation.

## Scope

### In Scope
- Jest E2E suite under `test/e2e/` covering full flow
- Test helpers (`test/helpers/`) for fixtures, auth, HTTP, polling
- Duplicate HTTP request idempotency test (same `Idempotency-Key`)
- Duplicate Kafka message test (replayed `PayrollJobCreated`)

### Out of Scope
- Performance/load tests (Phase 16)
- Chaos/failure injection (Phase 16)
- CI pipeline integration
- Service unit/integration tests (exist per service)

## Capabilities

### New Capabilities
- `e2e-workflow-test`: Complete payroll processing E2E validation across all services

### Modified Capabilities
None — net-new test infrastructure.

## Approach

Jest suite under `test/e2e/` orchestrated by a `TestOrchestrator`:

1. Create test fixtures (CompanyId, HR user) via direct DB
2. Authenticate via auth-service `POST /auth/login` → JWT
3. Create N employees via employee-service `POST /employees`
4. Create period + job via payroll-service `POST /payroll-periods` + `POST /payroll-jobs` (with `Idempotency-Key`)
5. Poll projection-service `GET /api/projections/jobs/:jobId` until `status=Completed` (30×1s)
6. Assert transactions/payslips in processing-service
7. Assert projections updated (MongoDB)
8. Assert audit records in audit-service
9. **Idempotency #1**: Re-send `POST /payroll-jobs` with same key → assert no duplicate (201 first, 200 retry)
10. **Idempotency #2**: Publish duplicate `PayrollJobCreated` to Kafka → poll terminal → assert no duplicate

Helpers: fixture generation, JWT auth, HTTP client with retry, Kafka producer, polling loop, DB assertions.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `test/e2e/` | New | E2E test suite root |
| `test/helpers/` | New | Shared test infrastructure |
| `apps/*/src/` | None | No production code changes |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Missing query endpoints (projections, audit reads) | Med | Add lightweight GET endpoints where absent |
| Kafka delivery timing flaky | Low | 30×1s polling with configurable timeout |
| Test data collisions between runs | Low | Unique Idempotency-Key per run |

## Rollback Plan

Remove `test/e2e/` and `test/helpers/`. No production code touched.

## Dependencies

- All 8 services running via `docker compose up`
- Kafka topics auto-created
- Projection-service must expose `GET /api/projections/jobs/:jobId`
- Processing-service must expose transaction/payslip query endpoints

## Success Criteria

- [ ] Full flow (auth → employees → period → job → Kafka → processing → projection → audit) passes with correct terminal state
- [ ] Duplicate HTTP (`Idempotency-Key` replay) produces no duplicate transactions
- [ ] Duplicate Kafka message produces no duplicate transactions or payslips
- [ ] All assertions on completed state verified
