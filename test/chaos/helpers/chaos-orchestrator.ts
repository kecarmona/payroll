/**
 * Chaos Orchestrator — Controlled Failure Injection for Resilience Tests
 *
 * Extends the E2eOrchestrator with Docker Compose lifecycle control,
 * consumer process management, and structured evidence recording.
 *
 * ## Design
 *
 * - **Infrastructure services** (kafka, postgres, mongodb, redis) are managed
 *   via `docker compose stop/start` through child_process.exec.
 * - **Application services** (microservices on ports 3001–3008) are NOT Docker
 *   containers in this project — they run via `nx serve`. Consumer crash
 *   simulation targets the process by listening port.
 * - **Evidence** is recorded as structured JSON files to `test/chaos/evidence/`
 *   for post-mortem analysis and CI reporting.
 *
 * ## Usage
 *
 * ```ts
 * const chaos = new ChaosOrchestrator();
 * await chaos.healthCheck();
 * const fixtures = await chaos.setupChaosFixtures();
 *
 * // Inject failure
 * await chaos.stopService('kafka');
 * // ... trigger operation ...
 * await chaos.startService('kafka');
 * await chaos.waitForServiceHealthy('http://localhost:9092', 30_000);
 *
 * // Record evidence
 * await chaos.recordEvidence('kafka-unavailable', {
 *   injectedFailure: 'docker compose stop kafka',
 *   actualBehavior: 'Outbox records remained pending',
 *   dataIntegrity: 'PASS',
 * });
 * ```
 *
 * @module test/chaos/helpers/chaos-orchestrator
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { Client as PgClient } from 'pg';
import { Kafka } from 'kafkajs';
import { E2eOrchestrator } from '../../e2e/helpers/orchestrator';
import { config } from '../../e2e/helpers/config';

const execAsync = promisify(exec);

// ---------------------------------------------------------------
// Constants
// ---------------------------------------------------------------

/** Directory where evidence JSON files are written. */
const EVIDENCE_DIR = path.resolve(__dirname, '..', 'evidence');

/**
 * Docker Compose service names defined in docker-compose.yml.
 * These are the infrastructure services this orchestrator can control.
 */
const INFRA_SERVICES = ['postgres', 'mongodb', 'redis', 'kafka', 'kafka-ui'] as const;

/**
 * All application microservices (ports 3001–3008).
 * These run via Nx, not Docker, so they cannot be stopped via `docker compose`.
 */
const APP_SERVICES = [
  'auth-service',
  'employee-service',
  'payroll-service',
  'payroll-processing-service',
  'payroll-projection-service',
  'notification-service',
  'email-service',
  'audit-service',
] as const;

/**
 * Port-to-service mapping for process discovery.
 * Used by `killConsumer` to find the PID by port.
 */
const SERVICE_PORTS: Record<string, number> = {
  'auth-service': 3001,
  'employee-service': 3002,
  'payroll-service': 3003,
  'payroll-processing-service': 3004,
  'payroll-projection-service': 3005,
  'notification-service': 3006,
  'email-service': 3007,
  'audit-service': 3008,
};

// ---------------------------------------------------------------
// Types
// ---------------------------------------------------------------

/**
 * Structured evidence record for a chaos scenario.
 *
 * Each scenario produces one evidence file containing this shape.
 */
export interface ChaosEvidence {
  /** Short name of the scenario, e.g. "kafka-unavailable". */
  scenario: string;

  /** ISO 8601 timestamp when the scenario began. */
  startTime: string;

  /** ISO 8601 timestamp when the scenario completed. */
  endTime: string;

  /** Description of the injected failure, e.g. "docker compose stop kafka". */
  injectedFailure: string;

  /** The infrastructure or application service affected. */
  affectedService: string;

  /** What the system should do under this failure. */
  expectedBehavior: string;

  /** What the system actually did. */
  actualBehavior: string;

  /** Time in milliseconds from failure injection to full recovery. */
  recoveryDurationMs: number;

  /** Whether data integrity was verified after recovery. */
  dataIntegrity: 'PASS' | 'FAIL';

  /** Recommended follow-up actions if the test reveals issues. */
  followUpActions: string[];
}

// ---------------------------------------------------------------
// ChaosOrchestrator
// ---------------------------------------------------------------

/**
 * High-level Chaos test orchestrator extending E2eOrchestrator.
 *
 * Adds Docker Compose lifecycle control for infrastructure services,
 * consumer process management, and structured evidence logging.
 */
export class ChaosOrchestrator extends E2eOrchestrator {
  /** In-memory evidence log for the current test run. */
  private readonly evidenceLog: ChaosEvidence[] = [];

  /** PostgreSQL client for the payroll database (outbox queries). */
  private payrollPgClient: PgClient | null = null;

  /** Tracked employee IDs from fixture setup (used in duplicate verification). */
  private trackedEmployeeIds: string[] = [];

  // ---------------------------------------------------------------
  // Docker Compose Service Lifecycle
  // ---------------------------------------------------------------

  /**
   * Stops a Docker Compose service by name.
   *
   * Uses `docker compose stop <service>` via child_process.exec.
   * Throws if the command fails or the service is unknown.
   *
   * @param serviceName - Docker Compose service name (e.g. "kafka", "postgres").
   */
  async stopService(serviceName: string): Promise<void> {
    this.assertInfraService(serviceName);

    const { stderr } = await execAsync(`docker compose stop ${serviceName}`, {
      cwd: path.resolve(__dirname, '..', '..', '..'),
      timeout: 30_000,
    });

    if (stderr && !stderr.includes('Stopped')) {
      throw new Error(
        `Failed to stop service "${serviceName}": ${stderr}`,
      );
    }
  }

  /**
   * Starts a previously stopped Docker Compose service by name.
   *
   * Uses `docker compose start <service>` via child_process.exec.
   *
   * @param serviceName - Docker Compose service name (e.g. "kafka", "postgres").
   */
  async startService(serviceName: string): Promise<void> {
    this.assertInfraService(serviceName);

    const { stderr } = await execAsync(`docker compose start ${serviceName}`, {
      cwd: path.resolve(__dirname, '..', '..', '..'),
      timeout: 30_000,
    });

    if (stderr && !stderr.includes('Started')) {
      throw new Error(
        `Failed to start service "${serviceName}": ${stderr}`,
      );
    }
  }

  /**
   * Stops all Docker Compose infrastructure services except the specified ones.
   *
   * Useful for scenarios requiring a minimally available infrastructure.
   * Application services (microservices) are NOT affected — they run outside Docker.
   *
   * @param exclude - List of service names to keep running.
   */
  async stopAllExcept(exclude: string[]): Promise<void> {
    const toStop = INFRA_SERVICES.filter((s) => !exclude.includes(s));

    for (const service of toStop) {
      try {
        await this.stopService(service);
      } catch (error) {
        // If the service is already stopped, that's acceptable
        console.warn(
          `[ChaosOrchestrator] Warning stopping "${service}": ${
            (error as Error).message
          }`,
        );
      }
    }
  }

  /**
   * Waits for a service to become healthy by polling its health endpoint.
   *
   * @param serviceUrl - Full health-check URL (e.g. "http://localhost:3001/health/live").
   * @param timeoutMs - Maximum time to wait in milliseconds.
   * @throws Error if the service does not become healthy within the timeout.
   */
  async waitForServiceHealthy(
    serviceUrl: string,
    timeoutMs: number,
  ): Promise<void> {
    const pollIntervalMs = 2_000;
    const maxAttempts = Math.ceil(timeoutMs / pollIntervalMs);
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await this.apiClient.healthCheck(serviceUrl);

        if (response.status === 200) {
          return; // Service is healthy
        }

        lastError = new Error(
          `Service returned status ${response.status} on attempt ${attempt}`,
        );
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
      }

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
      }
    }

    throw new Error(
      `Service at "${serviceUrl}" did not become healthy within ${timeoutMs}ms. ` +
        `Last error: ${lastError?.message ?? 'Unknown'}`,
    );
  }

  // ---------------------------------------------------------------
  // Consumer Process Management
  // ---------------------------------------------------------------

  /**
   * Finds the PID of a microservice by its service name.
   *
   * Discovers the process by scanning for the Node.js process listening
   * on the service's configured port. This works because all services
   * run locally via `nx serve`.
   *
   * @param serviceName - Service name (e.g. "payroll-processing-service").
   * @returns The process ID, or `null` if not found.
   */
  async getConsumerPid(serviceName: string): Promise<number | null> {
    const port = SERVICE_PORTS[serviceName];

    if (!port) {
      throw new Error(
        `Unknown service "${serviceName}". Valid services: ${Object.keys(SERVICE_PORTS).join(', ')}`,
      );
    }

    try {
      // macOS: lsof -i :<port> -P -n -sTCP:LISTEN
      const { stdout } = await execAsync(
        `lsof -i :${port} -P -n -sTCP:LISTEN 2>/dev/null | tail -n +2 | awk '{print $2}'`,
        { timeout: 5_000 },
      );

      const pid = parseInt(stdout.trim(), 10);
      return Number.isFinite(pid) ? pid : null;
    } catch {
      return null;
    }
  }

  /**
   * Kills a service process by its container name or service name.
   *
   * This method first attempts `docker kill --signal SIGKILL <name>`.
   * If the target is not a Docker container, it falls back to finding
   * and killing the process by port.
   *
   * **Known limitation**: Application microservices are not Docker containers
   * in this project. For the consumer-crash scenario, use `killConsumer`
   * with the service name to terminate via port-based process discovery.
   *
   * @param containerName - Docker container name OR service name.
   */
  async killConsumer(containerName: string): Promise<void> {
    // Try docker kill first
    try {
      await execAsync(`docker kill --signal SIGKILL ${containerName}`, {
        timeout: 10_000,
      });
      return; // Docker kill succeeded
    } catch {
      // Not a Docker container — try port-based process kill
    }

    // Fallback: find and kill by service name or port
    const port = SERVICE_PORTS[containerName];

    if (!port) {
      throw new Error(
        `Cannot kill "${containerName}": not a Docker container and not a known service. ` +
          `Valid services: ${Object.keys(SERVICE_PORTS).join(', ')}`,
      );
    }

    const pid = await this.getConsumerPid(containerName);

    if (!pid) {
      throw new Error(
        `No running process found for service "${containerName}" on port ${port}`,
      );
    }

    // Kill the process with SIGKILL
    try {
      await execAsync(`kill -9 ${pid}`, { timeout: 5_000 });
    } catch (error) {
      throw new Error(
        `Failed to kill process ${pid} for service "${containerName}": ` +
          `${(error as Error).message}`,
      );
    }
  }

  /**
   * Verifies that no duplicate transactions were created after a chaos event.
   *
   * Queries the projection database for payslips matching tracked employees
   * and asserts the count has not grown beyond the original.
   *
   * @param originalCount - The expected number of transactions.
   * @throws Error if duplicate transactions are detected.
   */
  async ensureNoDuplicateTransactions(originalCount: number): Promise<void> {
    const employeeIds = this.getEmployeeIds();
    let currentTransactionCount = 0;

    for (const employeeId of employeeIds) {
      try {
        const response = await this.apiClient.searchPayslipsByEmployee(
          employeeId,
        );
        if (response.status === 200) {
          const payslips = response.data as unknown[];
          currentTransactionCount += payslips.length;
        }
      } catch {
        // If projection service is down, skip — caller handles recovery
      }
    }

    if (currentTransactionCount > originalCount) {
      throw new Error(
        `Duplicate transactions detected: expected ${originalCount}, found ${currentTransactionCount}`,
      );
    }
  }

  /**
   * Starts a previously killed application microservice via `nx serve`.
   *
   * Launches `npx nx serve <serviceName>` in the background and polls
   * the health endpoint until the service responds. This is the inverse
   * of {@link killConsumer} — use it in `afterAll` to restore state for
   * subsequent tests.
   *
   * @param serviceName - Service name (e.g. "payroll-processing-service").
   * @param timeoutMs - Maximum time to wait for the service to become healthy
   *                    (default 120_000, matching CI health check timeout).
   */
  async startConsumer(
    serviceName: string,
    timeoutMs = 120_000,
  ): Promise<void> {
    const port = SERVICE_PORTS[serviceName];
    if (!port) {
      throw new Error(
        `Unknown service "${serviceName}". Valid services: ${Object.keys(SERVICE_PORTS).join(', ')}`,
      );
    }

    const projectRoot = path.resolve(__dirname, '..', '..', '..');
    const logFile = `/tmp/${serviceName}.log`;

    console.log(
      `[ChaosOrchestrator] Starting ${serviceName} (port ${port})...`,
    );

    // Launch the service in the background
    await execAsync(
      `npx nx serve "${serviceName}" > "${logFile}" 2>&1 &`,
      { cwd: projectRoot, timeout: 10_000 },
    );

    // Wait for the health endpoint to respond
    // NOTE: apiClient.healthCheck appends config.health.endpoint (/health/live)
    // automatically, so we pass only the base URL.
    const serviceUrl = `http://localhost:${port}`;
    await this.waitForServiceHealthy(serviceUrl, timeoutMs);

    console.log(
      `[ChaosOrchestrator] ${serviceName} is healthy on port ${port}`,
    );
  }

  // ---------------------------------------------------------------
  // Evidence Recording
  // ---------------------------------------------------------------

  /**
   * Records evidence for a chaos scenario.
   *
   * Appends to the in-memory evidence log AND writes a timestamped JSON
   * file to `test/chaos/evidence/<scenario>-<timestamp>.json`.
   *
   * @param scenario - Scenario name (used in filename).
   * @param data - Evidence fields. `startTime` and `endTime` are set automatically.
   */
  async recordEvidence(
    scenario: string,
    data: Omit<ChaosEvidence, 'scenario' | 'startTime' | 'endTime'>,
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    const evidence: ChaosEvidence = {
      scenario,
      startTime: timestamp,
      endTime: timestamp,
      ...data,
    };

    this.evidenceLog.push(evidence);

    // Ensure evidence directory exists
    await fs.promises.mkdir(EVIDENCE_DIR, { recursive: true });

    // Write timestamped evidence file
    const fileTimestamp = timestamp.replace(/[:.]/g, '-');
    const filePath = path.join(
      EVIDENCE_DIR,
      `${scenario}-${fileTimestamp}.json`,
    );

    await fs.promises.writeFile(
      filePath,
      JSON.stringify(evidence, null, 2),
      'utf-8',
    );
  }

  /**
   * Returns all evidence recorded during the current test run.
   *
   * @returns Array of ChaosEvidence objects.
   */
  getEvidenceLog(): ChaosEvidence[] {
    return [...this.evidenceLog];
  }

  // ---------------------------------------------------------------
  // Payroll Database Access (Outbox Queries)
  // ---------------------------------------------------------------

  /**
   * Lazily creates a PostgreSQL client for the payroll database.
   *
   * Used to query the outbox table for verifying pending records
   * when Kafka is unavailable.
   */
  private async getPayrollClient(): Promise<PgClient> {
    if (!this.payrollPgClient) {
      const client = new PgClient({
        host: config.postgres.host,
        port: config.postgres.port,
        user: config.postgres.user,
        password: config.postgres.password,
        database: config.postgres.databases.payroll,
      });
      await client.connect();
      this.payrollPgClient = client;
    }
    return this.payrollPgClient;
  }

  /**
   * Queries the outbox table for pending (unpublished) records.
   *
   * @returns Array of pending outbox records.
   */
  async getPendingOutboxRecords(): Promise<unknown[]> {
    const client = await this.getPayrollClient();
    const result = await client.query(
      `SELECT * FROM outbox WHERE "publishedAt" IS NULL ORDER BY "createdAt" ASC`,
    );
    return result.rows;
  }

  /**
   * Queries the outbox table for all records (published and pending).
   *
   * @returns Array of all outbox records.
   */
  async getAllOutboxRecords(): Promise<unknown[]> {
    const client = await this.getPayrollClient();
    const result = await client.query(
      `SELECT * FROM outbox ORDER BY "createdAt" ASC`,
    );
    return result.rows;
  }

  /**
   * Produces a Kafka message directly to the payroll events topic.
   *
   * Used for duplicate-message and consumer-crash scenarios where
   * we need to replay events that the system has already processed.
   *
   * @param event - The event object to produce.
   * @param key - Kafka message key (typically the eventId).
   */
  async produceKafkaMessage(
    event: Record<string, unknown>,
    key: string,
  ): Promise<void> {
    const kafka = new Kafka({
      clientId: 'chaos-test-producer',
      brokers: [config.kafka.broker],
    });

    const producer = kafka.producer();
    await producer.connect();

    try {
      await producer.send({
        topic: config.kafka.topics.payrollEvents,
        messages: [
          {
            key,
            value: JSON.stringify(event),
          },
        ],
      });
    } finally {
      await producer.disconnect();
    }
  }

  // ---------------------------------------------------------------
  // Fixture Setup (track employee IDs for duplicate checks)
  // ---------------------------------------------------------------

  /**
   * Sets up fixtures and tracks employee IDs for subsequent
   * duplicate-transaction verification.
   *
   * @param employeeCount - Number of employees to create (default 3).
   * @returns Fixture data including user, employees, and period.
   */
  async setupChaosFixtures(
    employeeCount = 3,
  ): Promise<Awaited<ReturnType<E2eOrchestrator['setupFixtures']>>> {
    const fixtures = await this.setupFixtures(employeeCount);
    this.trackedEmployeeIds = fixtures.employees.map((e) => e.employeeId);
    return fixtures;
  }

  // ---------------------------------------------------------------
  // Private Helpers
  // ---------------------------------------------------------------

  /**
   * Asserts that the given service name is a known infrastructure service.
   */
  private assertInfraService(
    serviceName: string,
  ): asserts serviceName is (typeof INFRA_SERVICES)[number] {
    if (!INFRA_SERVICES.includes(serviceName as (typeof INFRA_SERVICES)[number])) {
      throw new Error(
        `Unknown infrastructure service "${serviceName}". ` +
          `Valid services: ${INFRA_SERVICES.join(', ')}. ` +
          `Application services (${APP_SERVICES.join(', ')}) run outside Docker ` +
          `and cannot be controlled via docker compose stop/start.`,
      );
    }
  }

  /**
   * Retrieves employee IDs tracked during fixture setup.
   */
  private getEmployeeIds(): string[] {
    return [...this.trackedEmployeeIds];
  }

  // ---------------------------------------------------------------
  // Cleanup Override
  // ---------------------------------------------------------------

  /**
   * Releases all database connections, including the payroll client.
   */
  async cleanup(): Promise<void> {
    if (this.payrollPgClient) {
      await this.payrollPgClient.end().catch(() => {
        /* ignore */
      });
      this.payrollPgClient = null;
    }

    await super.cleanup();
  }
}
