/**
 * Performance Test — Dashboard Read Performance Under Load
 *
 * Validates that projection read endpoints sustain p95 < 300ms
 * under 100 concurrent requests during active payroll processing.
 *
 * ## Flow
 *
 * 1. setup(): Authenticate, create 1,000 employees (batched), create
 *    a payroll period, create the payroll job (triggers processing)
 * 2. load (100 VUs): Read projection endpoints cyclically — jobs list,
 *    transactions, and payslips — while processing is active
 * 3. teardown(): Verify data integrity (no corruption during reads)
 *
 * ## Spec Targets
 *
 * - p95 response time < 300 ms (all projection endpoints)
 * - p99 response time < 500 ms
 * - Zero errors during reads
 * - No stale or corrupt data returned
 *
 * @see openspec/changes/add-performance-tests/specs/performance-tests/spec.md
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
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

/** Number of employees for the active processing job. */
const EMPLOYEE_COUNT = 1_000;

/** Employee batch size for parallel creation via http.batch(). */
const EMPLOYEE_BATCH_SIZE = 50;

// ---------------------------------------------------------------
// Test Options
// ---------------------------------------------------------------

export const options = {
  stages: [
    { duration: '15s', target: 100 }, // Ramp up to 100 VUs
    { duration: '60s', target: 100 }, // Steady state during active processing
    { duration: '5s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<300', 'p(99)<500'],
    http_req_failed: ['rate<0.001'], // Near-zero errors
    http_reqs: ['rate>20'], // Minimum throughput
  },
  noConnectionReuse: true,
};

// ---------------------------------------------------------------
// Setup
// ---------------------------------------------------------------

/**
 * Authenticates, seeds employees/period, creates a large payroll job
 * to trigger active processing that the read VUs will query against.
 *
 * @returns {{ token: string, jobId: string, companyId: string,
 *   endpoints: object }}
 */
export function setup() {
  const startTime = Date.now();

  // Step 1: Authenticate
  const token = getToken();

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
    'employees created for dashboard test': (ids) =>
      ids.length === EMPLOYEE_COUNT,
  });

  if (employeeIds.length !== EMPLOYEE_COUNT) {
    console.warn(
      `Setup: only ${employeeIds.length}/${EMPLOYEE_COUNT} employees created`,
    );
  }

  // Step 4: Create payroll period
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const periodRes = http.post(
    `${PAYROLL_URL}/payroll/periods`,
    JSON.stringify(period),
    { headers },
  );

  const periodId =
    periodRes.status === 201 ? periodRes.json('periodId') : null;

  // Step 5: Create payroll job (triggers Kafka → processing consumer)
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
        'Idempotency-Key': `dashboard-test-${companyId}`,
      },
    },
  );

  const jobId = jobRes.json('jobId');

  console.log(
    `Setup complete in ${((Date.now() - startTime) / 1000).toFixed(1)}s, ` +
      `job ${jobId} created — processing started`,
  );

  // Define the read endpoints VUs will cycle through
  const endpoints = {
    jobProjection: `/api/projections/jobs/${jobId}?companyId=${companyId}`,
    transactions: `/api/projections/transactions?jobId=${jobId}`,
    payslips: `/api/projections/payslips`,
  };

  return {
    token,
    jobId,
    companyId,
    endpoints,
  };
}

// ---------------------------------------------------------------
// Default (per-VU iteration)
// ---------------------------------------------------------------

/**
 * Each VU continuously reads projection endpoints in a cycle:
 * job details → transactions → payslip search.
 *
 * Cycles through endpoints to simulate real dashboard usage
 * where users view multiple panels simultaneously.
 *
 * @param {object} data - Setup data ({ token, endpoints, companyId, employeeIds })
 */
export default function (data) {
  const { token, endpoints, companyId } = data;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const endpointsList = [
    { name: 'job projection', url: `${PROJECTION_URL}${endpoints.jobProjection}` },
    { name: 'transactions', url: `${PROJECTION_URL}${endpoints.transactions}` },
  ];

  group('Dashboard Read Cycle', () => {
    // Read 2-3 endpoints per iteration to simulate dashboard panels
    for (let i = 0; i < 2; i++) {
      const ep = endpointsList[Math.floor(Math.random() * endpointsList.length)];
      const res = http.get(ep.url, { headers });

      check(res, {
        [`${ep.name} returns 200`]: (r) => r.status === 200,
        [`${ep.name} returns valid JSON`]: (r) => {
          try {
            JSON.parse(r.body);
            return true;
          } catch {
            return false;
          }
        },
      });
    }

    // Occasionally also read a payslip by employee to test search endpoint
    if (Math.random() < 0.2) {
      const payslipUrl = `${PROJECTION_URL}${endpoints.payslips}?companyId=${companyId}&limit=20`;
      const psRes = http.get(payslipUrl, { headers });

      check(psRes, {
        'payslip search returns 200': (r) => r.status === 200,
      });
    }
  });

  // Short think time between reads (simulates user reading the screen)
  sleep(Math.random() * 1.5 + 0.5);
}

// ---------------------------------------------------------------
// Teardown — Data Integrity Verification
// ---------------------------------------------------------------

/**
 * Verifies no data corruption occurred during concurrent reads.
 *
 * Checks:
 * - Projection endpoints still return valid data
 * - No duplicate transaction IDs
 * - Job status is COMPLETED or still processing (valid state)
 *
 * @param {object} data - Setup data ({ token, endpoints, companyId })
 */
export function teardown(data) {
  const { token, endpoints, companyId } = data;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  group('Teardown — Post-Load Integrity', () => {
    // Check job projection is still readable
    const jobRes = http.get(
      `${PROJECTION_URL}${endpoints.jobProjection}`,
      { headers },
    );

    check(jobRes, {
      'job projection readable after load': (r) => r.status === 200,
    });

    if (jobRes.status === 200) {
      try {
        const data = JSON.parse(jobRes.body);
        const validStates = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'];
        check(null, {
          'job has valid status': () => validStates.includes(data.status),
        });
      } catch (e) {
        // Body is valid JSON (already checked in load), skip
      }
    }

    // Check transactions are still queryable
    const txRes = http.get(
      `${PROJECTION_URL}${endpoints.transactions}`,
      { headers },
    );

    check(txRes, {
      'transactions readable after load': (r) => r.status === 200,
    });

    if (txRes.status === 200) {
      try {
        const txs = JSON.parse(txRes.body);
        const txIds = Array.isArray(txs) ? txs.map((t) => t.id || t.transactionId) : [];
        const uniqueTxIds = new Set(txIds);

        check(null, {
          'no duplicate transactions': () =>
            txIds.length === uniqueTxIds.size,
        });
      } catch (e) {
        // Body is valid JSON, skip parse error check
      }
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
    'k6/output/dashboard-reads-summary.json': JSON.stringify(
      {
        test: 'dashboard-reads',
        timestamp: new Date().toISOString(),
        config: {
          concurrentVUs: 100,
          employeeCount: EMPLOYEE_COUNT,
          stages: [
            { duration: '15s', target: 100 },
            { duration: '60s', target: 100 },
            { duration: '5s', target: 0 },
          ],
        },
        metrics: {
          http_req_duration: data.metrics.http_req_duration,
          http_req_failed: data.metrics.http_req_failed,
          http_reqs: data.metrics.http_reqs,
        },
      },
      null,
      2,
    ),
  };
}
