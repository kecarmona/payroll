# Proposal: Add Payroll Projection Service

## Intent

Build a MongoDB-based CQRS projection service that consumes domain events and provides REST query endpoints for dashboards and reporting.

## Scope

1. **New service** `apps/payroll-projection-service/` — NestJS app with MongoDB (Mongoose)
2. **Kafka consumer** — consumes PayrollJobCreated, PayrollTransactionCompleted, PayrollTransactionFailed, PayslipGenerated
3. **MongoDB collections** — payroll jobs, transactions, payslips (denormalized read models)
4. **REST query endpoints** — dashboard queries, payslip search
5. **Idempotent handlers** — event ID tracking to prevent duplicate projections

## Non-goals

- Complex aggregation/reporting (basic queries only)
- Real-time push (WebSocket/SSE)
- Projection rebuild from scratch (documented but not implemented)

## Dependencies

- MongoDB (already in docker-compose)
- Mongoose for NestJS
- Kafka consumer (kafkajs)
- `libs/contracts` — event types
- `libs/event-bus` — EventDeserializer</think>

<｜DSML｜tool_calls>
<｜DSML｜invoke name="write">
<｜DSML｜parameter name="filePath" string="true">/Users/dev-01/Desktop/desarrollo/payroll/openspec/changes/add-payroll-projection-service/proposal.md