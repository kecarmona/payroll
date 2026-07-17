import { v4 as uuid } from 'uuid';
import { Client as PgClient } from 'pg';
import { Kafka } from 'kafkajs';
import { config } from './config';
import { ApiClient } from './api-client';
import { DatabaseCleaner } from './database-cleaner';
import { Poller, PollerTimeoutError } from './poller';
import {
  createUserFixture,
  createEmployeeFixture,
  createPeriodFixture,
  createJobFixture,
  type UserFixture,
  type EmployeeFixture,
  type PeriodFixture,
} from './fixture-factory';

// ---------------------------------------------------------------
// Types
// ---------------------------------------------------------------

export interface SetupFixturesResult {
  user: UserFixture;
  userResponse: { userId: string };
  employees: Array<{ fixture: EmployeeFixture; employeeId: string }>;
  period: PeriodFixture & { periodId: string };
  companyId: string;
}

export interface HappyPathResult {
  jobId: string;
  idempotencyKey: string;
  jobStatus: string;
}

export interface ProjectionVerificationResult {
  transactions: unknown[];
  payslips: unknown[];
}

export interface AuditRecord {
  id: string;
  eventId: string;
  eventType: string;
  companyId: string;
  correlationId: string;
  payloadSummary: Record<string, unknown>;
  occurredAt: string;
  recordedAt: string;
}

// ---------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------

/**
 * High-level E2E test orchestrator.
 *
 * Manages the complete test lifecycle for payroll workflow scenarios:
 * health checks, fixture setup, happy path execution, projection
 * verification, audit verification, idempotency testing, and cleanup.
 *
 * ## Usage
 *
 * ```ts
 * const orch = new E2eOrchestrator();
 * await orch.healthCheck();
 * const fixtures = await orch.setupFixtures();
 * const job = await orch.runHappyPath();
 * const projections = await orch.verifyProjections(job.jobId);
 * // ...
 * await orch.cleanup();
 * ```
 */
export class E2eOrchestrator {
  readonly apiClient: ApiClient;
  readonly dbCleaner: DatabaseCleaner;
  readonly poller: Poller;

  /** Tracks created resources for cleanup. */
  private readonly createdJobIds: string[] = [];

  /** PostgreSQL connection used for audit queries (lazy). */
  private auditPgClient: PgClient | null = null;
  private processingPgClient: PgClient | null = null;

  constructor() {
    this.apiClient = new ApiClient();
    this.dbCleaner = new DatabaseCleaner();
    this.poller = new Poller({
      intervalMs: config.polling.intervalMs,
      maxAttempts: config.polling.maxAttempts,
    });
  }

  // ---------------------------------------------------------------
  // 1. Health Check
  // ---------------------------------------------------------------

  /**
   * Probes all 8 services' health endpoints.
   *
   * @throws Error if any service is unavailable.
   */
  async healthCheck(): Promise<void> {
    const services = [
      { name: 'Auth', url: config.auth.baseUrl },
      { name: 'Employee', url: config.employee.baseUrl },
      { name: 'Payroll', url: config.payroll.baseUrl },
      { name: 'Processing', url: config.processing.baseUrl },
      { name: 'Projection', url: config.projection.baseUrl },
      { name: 'Notification', url: config.notification.baseUrl },
      { name: 'Email', url: config.email.baseUrl },
      { name: 'Audit', url: config.audit.baseUrl },
    ];

    const results = await Promise.allSettled(
      services.map(async (svc) => {
        const response = await this.apiClient.healthCheck(svc.url);
        if (response.status !== 200) {
          throw new Error(
            `${svc.name} service returned status ${response.status}`,
          );
        }
        return svc.name;
      }),
    );

    const failures = results.filter(
      (r): r is PromiseRejectedResult => r.status === 'rejected',
    );

    if (failures.length > 0) {
      const messages = failures
        .map((f) => f.reason?.message ?? 'Unknown error')
        .join('; ');
      throw new Error(`Health check failed: ${messages}`);
    }
  }

  // ---------------------------------------------------------------
  // 2. Fixture Setup
  // ---------------------------------------------------------------

  /**
   * Cleans the database, registers a user, logs in, creates employees
   * and a payroll period.
   *
   * @param employeeCount - Number of employees to create (default 3).
   * @returns All fixture data including user, employees, and period.
   */
  async setupFixtures(employeeCount = 3): Promise<SetupFixturesResult> {
    // Clean all databases first
    await this.dbCleaner.clean();

    // Create user fixture
    const user = createUserFixture();
    const registerResponse = await this.apiClient.register(
      user.email,
      user.password,
      user.role,
    );

    if (registerResponse.status !== 201) {
      throw new Error(
        `User registration failed: ${registerResponse.status} - ${JSON.stringify(registerResponse.data)}`,
      );
    }

    const userResponse = registerResponse.data as { userId: string };

    // Login to get JWT
    const loginResponse = await this.apiClient.login(user.email, user.password);

    if (loginResponse.status !== 200) {
      throw new Error(
        `Login failed: ${loginResponse.status} - ${JSON.stringify(loginResponse.data)}`,
      );
    }

    const companyId = 'default-company';

    // Create employees
    const employees = await this.createEmployees(companyId, employeeCount);

    // Create payroll period
    const period = await this.createPeriod(companyId);

    return {
      user,
      userResponse,
      employees,
      period,
      companyId,
    };
  }

  /**
   * Creates N employees for the given company.
   */
  private async createEmployees(
    companyId: string,
    count: number,
  ): Promise<Array<{ fixture: EmployeeFixture; employeeId: string }>> {
    const results: Array<{ fixture: EmployeeFixture; employeeId: string }> = [];

    for (let i = 0; i < count; i++) {
      const fixture = createEmployeeFixture(companyId, i);
      const response = await this.apiClient.createEmployee(fixture);

      if (response.status !== 201) {
        throw new Error(
          `Employee creation failed (${i}): ${response.status} - ${JSON.stringify(response.data)}`,
        );
      }

      results.push({
        fixture,
        employeeId: (response.data as { employeeId: string }).employeeId,
      });
    }

    return results;
  }

  /**
   * Creates a payroll period for the given company.
   */
  private async createPeriod(
    companyId: string,
  ): Promise<PeriodFixture & { periodId: string }> {
    const fixture = createPeriodFixture(companyId);
    const response = await this.apiClient.createPeriod(fixture);

    if (response.status !== 201) {
      throw new Error(
        `Period creation failed: ${response.status} - ${JSON.stringify(response.data)}`,
      );
    }

    return {
      ...fixture,
      periodId: (response.data as { periodId: string }).periodId,
    };
  }

  // ---------------------------------------------------------------
  // 3. Happy Path
  // ---------------------------------------------------------------

  /**
   * Creates a payroll job and polls until completion.
   *
   * @param companyId - The tenant/company identifier.
   * @param periodId - The payroll period ID.
   * @returns The job ID, idempotency key used, and final status.
   */
  async runHappyPath(
    companyId: string,
    periodId: string,
    employeeIds?: string[],
  ): Promise<HappyPathResult> {
    const idempotencyKey = uuid();

    // Create the payroll job
    const jobPayload = createJobFixture(companyId, periodId, employeeIds);
    const createResponse = await this.apiClient.createJob(
      jobPayload,
      idempotencyKey,
    );

    // Accept 201 (created) or 200 (already processed due to idempotency)
    if (createResponse.status !== 201 && createResponse.status !== 200) {
      throw new Error(
        `Job creation failed: ${createResponse.status} - ${JSON.stringify(createResponse.data)}`,
      );
    }

    const { jobId, status } = createResponse.data as {
      jobId: string;
      status: string;
    };
    this.createdJobIds.push(jobId);

    if (status === 'COMPLETED') {
      // Already completed — no polling needed
      return { jobId, idempotencyKey, jobStatus: status };
    }

    // Poll projection service until COMPLETED or FAILED
    try {
      const projectionResponse = await this.poller.waitFor(
        `${config.projection.baseUrl}${config.projection.endpoints.getJob(jobId)}?companyId=${companyId}`,
        (res) => {
          const data = res.data as { status?: string };
          return (
            data?.status === 'COMPLETED' || data?.status === 'FAILED'
          );
        },
        { Authorization: `Bearer ${this.apiClient.token}` },
      );

      const jobData = projectionResponse.data as { status: string };
      return { jobId, idempotencyKey, jobStatus: jobData.status };
    } catch (error) {
      if (error instanceof PollerTimeoutError) {
        throw new Error(
          `Job ${jobId} did not reach terminal state within polling budget. ` +
            `Last status: ${(error.lastResponse?.data as { status?: string })?.status ?? 'N/A'}`,
        );
      }
      throw error;
    }
  }

  // ---------------------------------------------------------------
  // 4. Projection Verification
  // ---------------------------------------------------------------

  /**
   * Verifies that the projection database contains the expected
   * transactions and payslips for a given job.
   *
   * @param jobId - The payroll job identifier.
   * @param _employeeIds - The employee IDs that should have payslips.
   * @returns The transactions and payslips found.
   */
  async verifyProjections(
    jobId: string,
    _employeeIds?: string[],
  ): Promise<ProjectionVerificationResult> {
    // Get transactions for this job
    const txResponse = await this.apiClient.getTransactions(jobId);
    const transactions = (txResponse.data as unknown[]) ?? [];

    // Get payslips — query by employeeId for each employee
    const payslips: unknown[] = [];

    if (_employeeIds && _employeeIds.length > 0) {
      for (const employeeId of _employeeIds) {
        const psResponse =
          await this.apiClient.searchPayslipsByEmployee(employeeId);
        if (psResponse.status === 200) {
          const employeePayslips = psResponse.data as unknown[];
          payslips.push(...employeePayslips);
        }
      }
    } else {
      // Fallback: try to extract employeeIds from transactions
      type TxWithEmployee = { employeeId?: string };
      const txData = transactions as TxWithEmployee[];
      const empIds = [
        ...new Set(txData.map((t) => t.employeeId).filter(Boolean)),
      ] as string[];

      for (const employeeId of empIds) {
        const psResponse =
          await this.apiClient.searchPayslipsByEmployee(employeeId);
        if (psResponse.status === 200) {
          const employeePayslips = psResponse.data as unknown[];
          payslips.push(...employeePayslips);
        }
      }
    }

    return { transactions, payslips };
  }

  // ---------------------------------------------------------------
  // 5. Audit Verification
  // ---------------------------------------------------------------

  /**
   * Queries the audit database directly for records related to a job.
   *
   * The audit service has no REST GET endpoints (append-only by design),
   * so E2E tests verify audit records by querying PostgreSQL directly.
   *
   * @param jobId - The payroll job identifier (searched in payloadSummary).
   * @returns Array of matching audit records.
   */
  async verifyAudit(jobId?: string): Promise<AuditRecord[]> {
    const client = await this.getAuditClient();

    // Build the query filter
    // Audit records store job info in payloadSummary (simple-json column)
    // We search for records where payloadSummary contains the jobId
    const result = await client.query<AuditRecord>(
      `SELECT id, "eventId", "eventType", "companyId", "correlationId",
              "payloadSummary", "occurredAt", "recordedAt"
       FROM audit_records
       WHERE "payloadSummary"::text LIKE $1
       ORDER BY "recordedAt" ASC`,
      [`%${jobId ?? ''}%`],
    );

    return result.rows;
  }

  /**
   * Queries all audit records for specific event types.
   *
   * @param eventTypes - Event types to filter by (e.g. 'PayrollJobCreated').
   * @returns Array of matching audit records.
   */
  async verifyAuditByEventType(
    eventTypes: string[],
  ): Promise<AuditRecord[]> {
    const client = await this.getAuditClient();

    const placeholders = eventTypes
      .map((_, i) => `$${i + 1}`)
      .join(', ');

    const result = await client.query<AuditRecord>(
      `SELECT id, "eventId", "eventType", "companyId", "correlationId",
              "payloadSummary", "occurredAt", "recordedAt"
       FROM audit_records
       WHERE "eventType" IN (${placeholders})
       ORDER BY "recordedAt" ASC`,
      eventTypes,
    );

    return result.rows;
  }

  // ---------------------------------------------------------------
  // 6. HTTP Idempotency
  // ---------------------------------------------------------------

  /**
   * Tests HTTP idempotency by replaying the same create-job request.
   *
   * @param payload - The create-job DTO body.
   * @param idempotencyKey - The original idempotency key.
   * @returns The response from the replayed request.
   */
  async testHttpIdempotency(
    payload: { companyId: string; periodId: string },
    idempotencyKey: string,
  ): Promise<{ status: number; data: unknown }> {
    const response = await this.apiClient.createJob(payload, idempotencyKey);
    return { status: response.status, data: response.data };
  }

  // ---------------------------------------------------------------
  // 7. Kafka Idempotency
  // ---------------------------------------------------------------

  /**
   * Tests Kafka consumer idempotency by producing a duplicate
   * PayrollJobCreated event and verifying no extra processing.
   *
   * After this method completes, the caller should verify that
   * transactions and payslips counts have NOT changed.
   *
   * @param originalEventId - The eventId from the original PayrollJobCreated.
   * @param jobId - The payroll job ID.
   * @param companyId - The tenant/company identifier.
   */
  async testKafkaIdempotency(
    originalEventId: string,
    jobId: string,
    companyId: string,
  ): Promise<void> {
    const kafka = new Kafka({
      clientId: 'e2e-test-idempotency',
      brokers: [config.kafka.broker],
    });

    const producer = kafka.producer();
    await producer.connect();

    try {
      // Produce a duplicate PayrollJobCreated event with the same eventId
      const duplicateEvent = {
        eventId: originalEventId,
        eventType: 'PayrollJobCreated',
        version: 1,
        timestamp: new Date().toISOString(),
        companyId,
        correlationId: uuid(),
        causationId: originalEventId,
        producer: 'e2e-test',
        payload: {
          jobId,
          companyId,
          periodId: '',
        },
      };

      await producer.send({
        topic: config.kafka.topics.payrollEvents,
        messages: [
          {
            key: originalEventId,
            value: JSON.stringify(duplicateEvent),
          },
        ],
      });

      // Wait for Kafka to deliver and consumer to process (or skip)
      await new Promise((resolve) => setTimeout(resolve, 5_000));
    } finally {
      await producer.disconnect();
    }
  }

  // ---------------------------------------------------------------
  // 8. Processing DB Queries
  // ---------------------------------------------------------------

  /**
   * Queries the payroll-processing database's processed_events table.
   *
   * @returns Array of processed event records.
   */
  async getProcessedEvents(): Promise<unknown[]> {
    const client = await this.getProcessingClient();
    const result = await client.query(
      `SELECT * FROM processed_events ORDER BY "processedAt" ASC`,
    );
    return result.rows;
  }

  /**
   * Checks the processed_events table for a specific event ID.
   *
   * @param eventId - The event ID to search for.
   * @returns The processed event record or null.
   */
  async findProcessedEvent(
    eventId: string,
  ): Promise<unknown | null> {
    const client = await this.getProcessingClient();
    const result = await client.query(
      `SELECT * FROM processed_events WHERE "eventId" = $1`,
      [eventId],
    );
    return result.rows[0] ?? null;
  }

  // ---------------------------------------------------------------
  // 9. Cleanup
  // ---------------------------------------------------------------

  /**
   * Releases all database connections and cleans up resources.
   */
  async cleanup(): Promise<void> {
    const closeTasks: Promise<void>[] = [];

    if (this.auditPgClient) {
      closeTasks.push(
        this.auditPgClient.end().catch(() => {
          /* ignore */
        }),
      );
      this.auditPgClient = null;
    }

    if (this.processingPgClient) {
      closeTasks.push(
        this.processingPgClient.end().catch(() => {
          /* ignore */
        }),
      );
      this.processingPgClient = null;
    }

    await Promise.all(closeTasks);
  }

  // ---------------------------------------------------------------
  // Private Helpers
  // ---------------------------------------------------------------

  /**
   * Lazily creates a PostgreSQL client for the audit database.
   *
   * Creates a new connection each time since clients are tracked
   * by reference and properly closed via cleanup().
   */
  private async getAuditClient(): Promise<PgClient> {
    const client = new PgClient({
      host: config.postgres.host,
      port: config.postgres.port,
      user: config.postgres.user,
      password: config.postgres.password,
      database: config.postgres.databases.audit,
    });
    await client.connect();
    this.auditPgClient = client;
    return client;
  }

  /**
   * Lazily creates a PostgreSQL client for the processing database.
   */
  private async getProcessingClient(): Promise<PgClient> {
    const client = new PgClient({
      host: config.postgres.host,
      port: config.postgres.port,
      user: config.postgres.user,
      password: config.postgres.password,
      database: config.postgres.databases.processing,
    });
    await client.connect();
    this.processingPgClient = client;
    return client;
  }
}
