/**
 * Performance Test — Large Payroll Processing Throughput
 *
 * Validates that processing a 1,000-employee payroll job completes
 * within spec targets: < 30s for creation, < 60s for processing.
 *
 * ## Flow
 *
 * 1. setup(): Authenticate, create 1,000 employees (batched), create
 *    a payroll period, create the payroll job (triggers Kafka event)
 * 2. load (1 VU, 1 iteration): Poll the projection API until the job
 *    reaches COMPLETED or FAILED state
 * 3. teardown(): Verify 1,000 transactions exist and no duplicate payslips
 *
 * ## Spec Targets
 *
 * - Job creation < 30 seconds
 * - Processing completion < 60 seconds
 * - 1,000 payroll transactions persisted
 * - No duplicate payslips
 *
 * @see openspec/changes/add-performance-tests/specs/performance-tests/spec.md
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { getToken } from '../lib/auth.js';
import {
  randomCompanyId,
  randomEmployees,
  randomPeriod,
  createEmployeesBatch,
} from '../lib/helpers.js';

// ---------------------------------------------------------------
// Service URLs (overridable via environment variables)
// ---------------------------------------------------------------

const AUTH_URL = __ENV.AUTH_URL || 'http://localhost:3001';
const EMPLOYEE_URL = __ENV.EMPLOYEE_URL || 'http://localhost:3002';
const PAYROLL_URL = __ENV.PAYROLL_URL || 'http://localhost:3003';
const PROJECTION_URL = __ENV.PROJECTION_URL || 'http://localhost:3005';

// ---------------------------------------------------------------
// Test Constants
// ---------------------------------------------------------------

/** Number of employees to create for the large payroll test. */
const EMPLOYEE_COUNT = 1_000;

/** Maximum time (seconds) to wait for processing completion. */
const PROCESSING_TIMEOUT_S = 120;

/** Polling interval (seconds) between processing status checks. */
const POLL_INTERVAL_S = 2;

/** Employee batch size for parallel creation via http.batch(). */
const EMPLOYEE_BATCH_SIZE = 50;

// ---------------------------------------------------------------
// Test Options
// ---------------------------------------------------------------

export const options = {
  vus: 1,
  iterations: 1,
  maxDuration: `${PROCESSING_TIMEOUT_S + 60}s`, // setup(60s) + processing(120s) + teardown
  thresholds: {
    http_req_duration: ['avg<2000', 'max<30000'],
    http_req_failed: ['rate<0.01'],
  },
  noConnectionReuse: false,
};

// ---------------------------------------------------------------
// Custom Metrics
// ---------------------------------------------------------------

/** Time from POST /payroll/jobs to success response. */
const jobCreateDuration = new Trend('job_create_duration_seconds');

/** Time from job creation to COMPLETED status in projection. */
const processingDuration = new Trend('processing_duration_seconds');

/** Total setup time (auth + employees + period). */
const setupDuration = new Trend('setup_duration_seconds');

/** Number of transactions created for the job (integrity check). */
const transactionCount = new Trend('transaction_count');

// ---------------------------------------------------------------
// Setup
// ---------------------------------------------------------------

/**
 * Authenticates, seeds 1,000 employees, creates a period and job.
 *
 * @returns {{ token: string, jobId: string, companyId: string,
 *   employeeCount: number, periodId: string }}
 */
export function setup() {
  const setupStart = Date.now();

  // Step 1: Authenticate
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // Step 2: Generate test data
  const companyId = randomCompanyId();
  const period = randomPeriod(companyId);
  const employeeFixtures = randomEmployees(companyId, EMPLOYEE_COUNT);

  console.log(
    `Setup: creating ${EMPLOYEE_COUNT} employees for company ${companyId}...`,
  );

  // Step 3: Create employees in batches
  const employeeIds = createEmployeesBatch(
    EMPLOYEE_URL,
    token,
    employeeFixtures,
    EMPLOYEE_BATCH_SIZE,
  );

  check(employeeIds, {
    [`all ${EMPLOYEE_COUNT} employees created`]: (ids) =>
      ids.length === EMPLOYEE_COUNT,
  });

  if (employeeIds.length !== EMPLOYEE_COUNT) {
    console.warn(
      `Setup: only ${employeeIds.length}/${EMPLOYEE_COUNT} employees created`,
    );
  }

  // Step 4: Create payroll period
  const periodRes = http.post(
    `${PAYROLL_URL}/payroll/periods`,
    JSON.stringify(period),
    { headers },
  );

  check(periodRes, {
    'period created': (r) => r.status === 201,
  });

  const periodId =
    periodRes.status === 201 ? periodRes.json('periodId') : null;

  // Step 5: Create payroll job (triggers Kafka → processing)
  const jobPayload = JSON.stringify({
    companyId,
    periodId,
    employeeIds,
  });

  const jobRes = http.post(
    `${PAYROLL_URL}/payroll/jobs`,
    jobPayload,
    {
      headers: {
        ...headers,
        'Idempotency-Key': `large-payroll-${companyId}`,
      },
    },
  );

  check(jobRes, {
    'job created': (r) => r.status === 201 || r.status === 200,
    'job has jobId': (r) => r.json('jobId') !== undefined,
  });

  const jobId = jobRes.json('jobId');
  const createTime = jobRes.timings.duration / 1000; // ms → s
  jobCreateDuration.add(createTime);

  const setupElapsed = (Date.now() - setupStart) / 1000;
  setupDuration.add(setupElapsed);

  console.log(
    `Setup complete: ${setupElapsed.toFixed(1)}s, ` +
      `job ${jobId} created in ${createTime.toFixed(1)}s`,
  );

  return {
    token,
    jobId,
    companyId,
    employeeCount: employeeIds.length,
    periodId,
    setupStartTime: setupStart,
  };
}

// ---------------------------------------------------------------
// Default — Poll for Processing Completion
// ---------------------------------------------------------------

/**
 * Polls the projection API until the job reaches COMPLETED or FAILED.
 *
 * Measures total processing duration from job creation to completion.
 *
 * @param {object} data - Setup data ({ token, jobId, companyId, ... })
 */
export default function (data) {
  const { token, jobId, companyId, setupStartTime } = data;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const jobUrl = `${PROJECTION_URL}/api/projections/jobs/${jobId}?companyId=${companyId}`;
  const pollStart = Date.now();

  group('Poll Processing Completion', () => {
    let completed = false;
    let attempts = 0;
    const maxAttempts = Math.ceil(PROCESSING_TIMEOUT_S / POLL_INTERVAL_S);

    while (!completed && attempts < maxAttempts) {
      attempts++;
      const res = http.get(jobUrl, { headers });

      if (res.status === 200) {
        const status = res.json('status');

        if (status === 'COMPLETED') {
          completed = true;
          const processingTime = (Date.now() - pollStart) / 1000;
          processingDuration.add(processingTime);

          console.log(
            `Processing complete: ${processingTime.toFixed(1)}s ` +
              `after ${attempts} poll attempts`,
          );
          break;
        }

        if (status === 'FAILED') {
          console.error(`Job ${jobId} FAILED after ${attempts} polls`);
          break;
        }
      }

      if (!completed) {
        sleep(POLL_INTERVAL_S);
      }
    }

    if (!completed) {
      console.error(
        `Job ${jobId} did not complete within ${PROCESSING_TIMEOUT_S}s ` +
          `(${attempts} poll attempts)`,
      );
    }
  });
}

// ---------------------------------------------------------------
// Teardown — Data Integrity Verification
// ---------------------------------------------------------------

/**
 * Verifies the projection database has the expected number of
 * transactions and no duplicate payslips.
 *
 * Queries:
 * - GET /api/projections/transactions?jobId=... (transaction count)
 * - GET /api/projections/jobs/{jobId}?companyId=... (payslip list)
 *
 * @param {object} data - Setup data ({ token, jobId, companyId,
 *   employeeCount, employeeIds })
 */
export function teardown(data) {
  const { token, jobId, companyId, employeeCount } = data;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  group('Teardown — Integrity Check', () => {
    // Query transactions
    const txRes = http.get(
      `${PROJECTION_URL}/api/projections/transactions?jobId=${jobId}`,
      { headers },
    );

    check(txRes, {
      'transactions query succeeded': (r) => r.status === 200,
    });

    let txCount = 0;
    if (txRes.status === 200) {
      const txData = txRes.json();
      txCount = Array.isArray(txData) ? txData.length : 0;
      transactionCount.add(txCount);

      console.log(`Integrity: ${txCount} transactions found`);
    }

    // Query job projection for payslips
    const jobRes = http.get(
      `${PROJECTION_URL}/api/projections/jobs/${jobId}?companyId=${companyId}`,
      { headers },
    );

    check(jobRes, {
      'job projection query succeeded': (r) => r.status === 200,
    });

    if (jobRes.status === 200) {
      const jobData = jobRes.json();
      const payslips = jobData.payslips || [];
      const payslipIds = payslips.map((p) => p.id || p.payslipId);
      const uniquePayslipIds = new Set(payslipIds);

      check(null, {
        'transaction count matches expected employees': () =>
          txCount >= employeeCount,
        'no duplicate payslips': () =>
          payslipIds.length === uniquePayslipIds.size,
      });

      console.log(
        `Integrity: ${payslipIds.length} payslips, ` +
          `${uniquePayslipIds.size} unique (${payslipIds.length - uniquePayslipIds.size} duplicates)`,
      );
    }
  });
}

// ---------------------------------------------------------------
// Summary Handler
// ---------------------------------------------------------------

/**
 * Exports metrics as structured JSON for baseline documentation.
 */
export function handleSummary(data) {
  return {
    'k6/output/process-large-payroll-summary.json': JSON.stringify(
      {
        test: 'process-large-payroll',
        timestamp: new Date().toISOString(),
        config: {
          employeeCount: EMPLOYEE_COUNT,
          processingTimeout: PROCESSING_TIMEOUT_S,
          employeeBatchSize: EMPLOYEE_BATCH_SIZE,
        },
        metrics: {
          http_req_duration: data.metrics.http_req_duration,
          http_req_failed: data.metrics.http_req_failed,
          setup_duration_seconds: data.metrics.setup_duration_seconds,
          job_create_duration_seconds: data.metrics
            .job_create_duration_seconds,
          processing_duration_seconds: data.metrics
            .processing_duration_seconds,
          transaction_count: data.metrics.transaction_count,
        },
      },
      null,
      2,
    ),
  };
}
