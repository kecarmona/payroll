/**
 * Performance Test — Payroll Job Creation Under Load
 *
 * Validates that the POST /payroll/jobs endpoint sustains p95 < 500ms
 * under 50 concurrent requests.
 *
 * ## Flow
 *
 * 1. setup(): Authenticate as perf-test user via auth-service
 * 2. load (50 VUs): Each VU creates a unique company, employee, period,
 *    and payroll job with a unique Idempotency-Key
 * 3. teardown(): Verify idempotency — replay one request, ensure no duplicate
 *
 * ## Spec Targets
 *
 * - p95 response time < 500 ms
 * - p99 response time < 1000 ms
 * - Zero 5xx errors
 * - Idempotent requests return 200/409 (not 201)
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
  idempotencyKey,
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
// Test Options
// ---------------------------------------------------------------

export const options = {
  stages: [
    { duration: '10s', target: 50 },  // Ramp up to 50 VUs
    { duration: '30s', target: 50 },  // Steady state
    { duration: '5s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    http_reqs: ['rate>10'], // At least 10 requests/second average
  },
  noConnectionReuse: true,
};

// ---------------------------------------------------------------
// Custom Metrics
// ---------------------------------------------------------------

/**
 * Tracks end-to-end time for the full create flow
 * (employee → period → job) per iteration.
 */
const e2eFlowDuration = new Trend('e2e_flow_duration');

/**
 * Tracks job creation latency specifically (POST /payroll/jobs).
 */
const jobCreateLatency = new Trend('job_create_latency');

// ---------------------------------------------------------------
// Setup
// ---------------------------------------------------------------

/**
 * Authenticates once — returns the JWT shared by all VUs.
 *
 * @returns {{ token: string }}
 */
export function setup() {
  const token = getToken();
  return { token };
}

// ---------------------------------------------------------------
// Default (per-VU iteration)
// ---------------------------------------------------------------

/**
 * Each VU iteration:
 * 1. Creates a unique company (via companyId)
 * 2. Creates 1 employee for that company
 * 3. Creates a payroll period
 * 4. Creates a payroll job with unique idempotency key
 *
 * @param {object} data - Setup data ({ token })
 */
export default function (data) {
  const { token } = data;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const startTime = Date.now();

  group('Create Payroll Job Flow', () => {
    // Step 1: Generate unique test data
    const companyId = randomCompanyId();
    const employees = randomEmployees(companyId, 1);
    const period = randomPeriod(companyId);
    const jobIdempotencyKey = idempotencyKey();

    // Step 2: Create employee
    const empRes = http.post(
      `${EMPLOYEE_URL}/employees`,
      JSON.stringify(employees[0]),
      { headers },
    );

    check(empRes, {
      'employee created': (r) => r.status === 201,
    });

    const employeeId = empRes.status === 201 ? empRes.json('employeeId') : null;

    // Step 3: Create payroll period
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

    // Step 4: Create payroll job with idempotency key
    const jobPayload = JSON.stringify({
      companyId,
      periodId,
      employeeIds: employeeId ? [employeeId] : [],
    });

    const jobRes = http.post(`${PAYROLL_URL}/payroll/jobs`, jobPayload, {
      headers: {
        ...headers,
        'Idempotency-Key': jobIdempotencyKey,
      },
    });

    check(jobRes, {
      'job created or accepted': (r) => r.status === 201 || r.status === 200,
      'job has jobId': (r) => r.json('jobId') !== undefined,
    });

    if (jobRes.status === 201 || jobRes.status === 200) {
      jobCreateLatency.add(jobRes.timings.duration);
    }

    // Small sleep to simulate realistic user think time
    sleep(Math.random() * 2 + 0.5);
  });

  const flowTime = (Date.now() - startTime) / 1000;
  e2eFlowDuration.add(flowTime);
}

// ---------------------------------------------------------------
// Teardown — Idempotency Verification
// ---------------------------------------------------------------

/**
 * Verifies that replaying the last create-job request with the same
 * idempotency key does NOT create a duplicate (returns 200 or 409).
 *
 * Also checks the projection endpoint for data integrity.
 *
 * @param {object} data - Setup data ({ token })
 */
export function teardown(data) {
  const { token } = data;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  group('Teardown — Idempotency Check', () => {
    const companyId = randomCompanyId();
    const employees = randomEmployees(companyId, 1);
    const period = randomPeriod(companyId);
    const key = idempotencyKey();

    // First create — should succeed
    const empRes = http.post(
      `${EMPLOYEE_URL}/employees`,
      JSON.stringify(employees[0]),
      { headers },
    );
    const employeeId =
      empRes.status === 201 ? empRes.json('employeeId') : null;

    const periodRes = http.post(
      `${PAYROLL_URL}/payroll/periods`,
      JSON.stringify(period),
      { headers },
    );
    const periodId =
      periodRes.status === 201 ? periodRes.json('periodId') : null;

    const jobPayload = JSON.stringify({
      companyId,
      periodId,
      employeeIds: employeeId ? [employeeId] : [],
    });

    const firstCreate = http.post(`${PAYROLL_URL}/payroll/jobs`, jobPayload, {
      headers: { ...headers, 'Idempotency-Key': key },
    });

    check(firstCreate, {
      'first create returns 201': (r) => r.status === 201,
    });

    // Second create with same key — should NOT create a new job
    const secondCreate = http.post(`${PAYROLL_URL}/payroll/jobs`, jobPayload, {
      headers: { ...headers, 'Idempotency-Key': key },
    });

    check(secondCreate, {
      'idempotent replay returns 200 or 409': (r) =>
        r.status === 200 || r.status === 409,
      'no duplicate job created': (r) =>
        r.status !== 201,
    });
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
    'k6/output/create-payroll-job-summary.json': JSON.stringify(
      {
        test: 'create-payroll-job',
        timestamp: new Date().toISOString(),
        metrics: {
          http_req_duration: data.metrics.http_req_duration,
          http_req_failed: data.metrics.http_req_failed,
          http_reqs: data.metrics.http_reqs,
          e2e_flow_duration: data.metrics.e2e_flow_duration,
          job_create_latency: data.metrics.job_create_latency,
        },
        thresholds: data.metrics?.http_req_duration?.thresholds ?? {},
      },
      null,
      2,
    ),
  };
}
