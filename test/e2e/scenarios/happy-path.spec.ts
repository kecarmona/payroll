/**
 * Happy Path — Full Payroll Workflow
 *
 * Validates the complete payroll processing chain:
 * register → login → create employees → create period →
 * create job → poll completion → verify projections → verify audit.
 *
 * This is the primary E2E scenario. If this test passes, the core
 * payroll pipeline (auth → employee → payroll → Kafka → processing
 * → projection → audit) is healthy.
 *
 * ## Prerequisites
 *
 * - All 8 microservices running (ports 3001-3008)
 * - PostgreSQL and MongoDB accessible
 * - Kafka broker on localhost:9092
 */

import { E2eOrchestrator } from '../helpers/orchestrator';

describe('Happy Path — Full Payroll Workflow', () => {
  const orchestrator = new E2eOrchestrator();
  let fixtures: Awaited<ReturnType<typeof orchestrator.setupFixtures>>;
  let jobResult: Awaited<ReturnType<typeof orchestrator.runHappyPath>>;

  jest.setTimeout(180_000);

  beforeAll(async () => {
    // Step 1: Health check all services
    await orchestrator.healthCheck();

    // Step 2-4: Register user, login, create employees + period
    fixtures = await orchestrator.setupFixtures(3);
  });

  afterAll(async () => {
    await orchestrator.cleanup();
  });

  it('should create a payroll job and complete processing', async () => {
    // Step 5-6: Create job with Idempotency-Key and poll for completion
    jobResult = await orchestrator.runHappyPath(
      fixtures.companyId,
      fixtures.period.periodId,
      fixtures.employees.map((e) => e.employeeId),
    );

    // Step 7: Assert job completed
    expect(jobResult.jobId).toBeDefined();
    expect(jobResult.jobStatus).toBe('COMPLETED');
  });

  it('should have 3 transactions in the projection database', async () => {
    expect(jobResult).toBeDefined();
    const { transactions } = await orchestrator.verifyProjections(
      jobResult.jobId,
    );

    expect(transactions).toHaveLength(3);
  });

  it('should have 3 payslips in the projection database', async () => {
    expect(jobResult).toBeDefined();
    const employeeIds = fixtures.employees.map((e) => e.employeeId);
    const { payslips } = await orchestrator.verifyProjections(
      jobResult.jobId,
      employeeIds,
    );

    expect(payslips).toHaveLength(3);
  });

  it('should have audit records for PayrollJobCreated and PayslipGenerated', async () => {
    expect(jobResult).toBeDefined();
    const auditRecords = await orchestrator.verifyAuditByEventType([
      'PayrollJobCreated',
      'PayslipGenerated',
    ]);

    expect(auditRecords.length).toBeGreaterThanOrEqual(4);

    const createdRecords = auditRecords.filter(
      (r) => r.eventType === 'PayrollJobCreated',
    );
    const payslipRecords = auditRecords.filter(
      (r) => r.eventType === 'PayslipGenerated',
    );

    expect(createdRecords.length).toBeGreaterThanOrEqual(1);
    expect(payslipRecords.length).toBeGreaterThanOrEqual(3);
  });
});
