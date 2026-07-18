# Spec: Add Payroll Projection Service

## 1. MongoDB Collections

### 1.1 PayrollJobProjection

| Field | Type | Description |
|---|---|---|
| _id | ObjectId | Auto-generated |
| jobId | string | Payroll job ID (unique index) |
| companyId | string | Tenant ID |
| periodId | string | Payroll period ID |
| status | string | CREATED / PROCESSING / COMPLETED / FAILED |
| totalEmployees | number | Count of eligible employees |
| processedCount | number | Count of completed transactions |
| failedCount | number | Count of failed transactions |
| createdAt | Date | From event timestamp |
| updatedAt | Date | Last event timestamp |
| lastEventId | string | Source event ID (idempotency) |

### 1.2 PayrollTransactionProjection

| Field | Type | Description |
|---|---|---|
| _id | ObjectId | Auto-generated |
| transactionId | string | Unique (indexed) |
| jobId | string | Parent job ID (indexed) |
| employeeId | string | Employee ID |
| companyId | string | Tenant ID |
| periodId | string | Payroll period ID |
| status | string | PENDING / PROCESSING / COMPLETED / FAILED |
| grossPay | number | Calculated gross pay |
| deductions | number | Calculated deductions |
| netPay | number | Calculated net pay |
| createdAt | Date | Event timestamp |
| updatedAt | Date | Last update timestamp |
| lastEventId | string | Source event ID |

### 1.3 PayslipProjection

| Field | Type | Description |
|---|---|---|
| _id | ObjectId | Auto-generated |
| payslipId | string | Unique payslip ID (indexed) |
| transactionId | string | Source transaction ID |
| jobId | string | Parent job ID (indexed) |
| employeeId | string | Employee ID |
| companyId | string | Tenant ID |
| periodId | string | Payroll period ID |
| grossPay | number | Calculated gross pay |
| deductions | number | Calculated deductions |
| netPay | number | Calculated net pay |
| generatedAt | Date | Payslip generation timestamp |
| lastEventId | string | Source event ID |

## 2. Kafka Consumer

Consumes from `payroll.events` topic, routes by eventType to the correct projection handler.

## 3. REST Endpoints

| Method | Path | Description |
|---|---|---|
| GET | /api/projections/jobs?companyId= | List payroll jobs for a company |
| GET | /api/projections/jobs/:jobId | Get single job with transaction summary |
| GET | /api/projections/transactions?jobId= | List transactions for a job |
| GET | /api/projections/payslips?employeeId= | Search payslips by employee |
| GET | /api/projections/payslips/:payslipId | Get single payslip |

## Acceptance Criteria

1. PayrollJobCreated → job projection created in MongoDB
2. PayrollTransactionCompleted → transaction + job counts updated
3. PayrollTransactionFailed → transaction + job counts updated
4. PayslipGenerated → payslip projection created
5. Duplicate events → no-op (idempotent handlers)
6. REST endpoints return projected data
7. All endpoints filter by companyId (multi-tenant)
