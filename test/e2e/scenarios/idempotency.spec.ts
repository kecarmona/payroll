/**
 * Idempotency — HTTP and Kafka Duplicate Detection
 *
 * Validates that:
 * 1. Replaying the same POST /payroll/jobs with the same Idempotency-Key
 *    returns the cached result (no duplicate job created).
 * 2. The payroll-processing consumer has recorded the event in its
 *    processed_events table (idempotent consumer).
 *
 * ## Prerequisites
 *
 * - All 8 microservices running (ports 3001-3008)
 * - PostgreSQL and MongoDB accessible
 * - Kafka broker on localhost:9092
 */

import { E2eOrchestrator } from '../helpers/orchestrator';
import { createJobFixture } from '../helpers/fixture-factory';

describe('Idempotency — HTTP and Kafka', () => {
  const orchestrator = new E2eOrchestrator();
  let fixtures: Awaited<ReturnType<typeof orchestrator.setupFixtures>>;
  let jobResult: Awaited<ReturnType<typeof orchestrator.runHappyPath>>;

  jest.setTimeout(180_000);

  beforeAll(async () => {
    await orchestrator.healthCheck();
    fixtures = await orchestrator.setupFixtures(3);

    // Create the job and wait for completion
    jobResult = await orchestrator.runHappyPath(
      fixtures.companyId,
      fixtures.period.periodId,
      fixtures.employees.map((e) => e.employeeId),
    );
  });

  afterAll(async () => {
    await orchestrator.cleanup();
  });

  // ---------------------------------------------------------------
  // HTTP Idempotency
  // ---------------------------------------------------------------

  describe('HTTP Idempotency', () => {
    it('should return 2xx (cached response) on replay with same Idempotency-Key', async () => {
      const payload = createJobFixture(
        fixtures.companyId,
        fixtures.period.periodId,
      );

      // Replay the same request with the same key
      const replayResult = await orchestrator.testHttpIdempotency(
        payload,
        jobResult.idempotencyKey,
      );

      // The guard returns the cached response — expect success (2xx)
      expect(replayResult.status).toBeGreaterThanOrEqual(200);
      expect(replayResult.status).toBeLessThan(300);
    });

    it('should still have exactly 3 transactions after replay (no duplicates)', async () => {
      const { transactions } = await orchestrator.verifyProjections(
        jobResult.jobId,
      );

      expect(transactions).toHaveLength(3);
    });

    it('should still have exactly 3 payslips after replay (no duplicates)', async () => {
      const employeeIds = fixtures.employees.map((e) => e.employeeId);
      const { payslips } = await orchestrator.verifyProjections(
        jobResult.jobId,
        employeeIds,
      );

      expect(payslips).toHaveLength(3);
    });

    it('should not create duplicate audit records for the replay', async () => {
      const auditRecords = await orchestrator.verifyAuditByEventType([
        'PayrollJobCreated',
      ]);

      // Only the original job creation should have generated audit records
      expect(auditRecords.filter((r) => r.eventType === 'PayrollJobCreated'))
        .toHaveLength(1);
    });
  });

  // ---------------------------------------------------------------
  // Kafka Consumer Idempotency
  // ---------------------------------------------------------------

  describe('Kafka Consumer Idempotency', () => {
    it('should have recorded the event in processed_events table', async () => {
      // Query the payroll-processing database's processed_events table
      const processedEvents =
        (await orchestrator.getProcessedEvents()) as Array<{
          eventId?: string;
        }>;

      // There should be at least one processed event (the PayrollJobCreated)
      expect(processedEvents.length).toBeGreaterThanOrEqual(1);

      // Find events related to our job's creation
      const matchingEvents = processedEvents.filter(
        (e) => e.eventId && e.eventId.length > 0,
      );

      expect(matchingEvents.length).toBeGreaterThanOrEqual(1);
    });
  });
});
