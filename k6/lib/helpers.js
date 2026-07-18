/**
 * Shared helpers for k6 performance tests.
 *
 * Provides deterministic and unique test data generators,
 * bulk employee creation via batched HTTP, and utility functions.
 *
 * ## Usage
 *
 * ```javascript
 * import { randomCompanyId, idempotencyKey, createEmployeesBatch } from '../lib/helpers.js';
 * ```
 */

import http from 'k6/http';
import { check } from 'k6';

// ---------------------------------------------------------------
// UUID Generation (no external dependencies)
// ---------------------------------------------------------------

/**
 * Generates a v4 UUID using Math.random().
 *
 * Avoids the HTTPS dependency on jslib.k6.io, making scripts
 * runnable in air-gapped or offline environments.
 *
 * @returns {string} RFC 4122 v4 UUID.
 */
export function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ---------------------------------------------------------------
// Test Data Generators
// ---------------------------------------------------------------

/**
 * Generates a unique company ID for test isolation.
 *
 * Each test run or VU gets a unique company to prevent
 * cross-contamination of data.
 *
 * @returns {string} Unique company identifier.
 */
export function randomCompanyId() {
  return `perf-co-${uuidv4().slice(0, 8)}`;
}

/**
 * Generates an array of employee fixture objects.
 *
 * Cycles through five salary profiles for variety. Each employee
 * gets a unique email derived from UUID.
 *
 * @param {string} companyId - The company to assign employees to.
 * @param {number} count - Number of employee fixtures to generate.
 * @returns {Array<object>} Array of employee creation DTOs.
 */
export function randomEmployees(companyId, count) {
  const profiles = [
    {
      position: 'Senior Engineer',
      salaryAmount: 7_500_00,
      department: 'Engineering',
    },
    {
      position: 'Marketing Manager',
      salaryAmount: 6_500_00,
      department: 'Marketing',
    },
    {
      position: 'HR Coordinator',
      salaryAmount: 5_500_00,
      department: 'Human Resources',
    },
    {
      position: 'Principal Architect',
      salaryAmount: 9_000_00,
      department: 'Engineering',
    },
    {
      position: 'Junior Analyst',
      salaryAmount: 4_800_00,
      department: 'Finance',
    },
  ];

  return Array.from({ length: count }, (_, i) => {
    const profile = profiles[i % profiles.length];
    return {
      email: `perf-emp-${uuidv4().slice(0, 8)}@test-payroll.com`,
      name: `Perf Employee ${i + 1}`,
      position: profile.position,
      salaryAmount: profile.salaryAmount,
      salaryCurrency: 'USD',
      department: profile.department,
      companyId,
    };
  });
}

/**
 * Generates a unique Idempotency-Key for safe HTTP retry.
 *
 * Each call produces a new UUID. Critical for create-payroll-job
 * requests to ensure safe retry without duplicate processing.
 *
 * @returns {string} RFC 4122 v4 UUID.
 */
export function idempotencyKey() {
  return uuidv4();
}

/**
 * Generates a payroll period fixture for the next calendar month.
 *
 * Computes month, year, start/end dates automatically so the period
 * is always valid and does not overlap with past periods.
 *
 * @param {string} companyId - The company to associate the period with.
 * @returns {object} Period creation DTO with companyId, month, year,
 *   startDate, and endDate.
 */
export function randomPeriod(companyId) {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const year = nextMonth.getFullYear();
  const month = nextMonth.getMonth() + 1; // 1-indexed
  const lastDay = new Date(year, nextMonth.getMonth() + 1, 0).getDate();

  return {
    companyId,
    month,
    year,
    startDate: `${year}-${String(month).padStart(2, '0')}-01`,
    endDate: `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
  };
}

// ---------------------------------------------------------------
// Bulk Employee Creation
// ---------------------------------------------------------------

/**
 * Creates employees via POST /employees in parallel batches.
 *
 * Uses http.batch() to send BATCH_SIZE requests concurrently,
 * significantly reducing setup time compared to sequential creation.
 *
 * @param {string} employeeUrl - Base URL of the employee service.
 * @param {string} token - JWT Bearer token.
 * @param {Array<object>} employeeFixtures - Array of employee DTOs.
 * @param {number} [batchSize=50] - Concurrent requests per batch.
 * @returns {string[]} Array of created employee IDs.
 */
export function createEmployeesBatch(
  employeeUrl,
  token,
  employeeFixtures,
  batchSize = 50,
) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const employeeIds = [];
  const totalBatches = Math.ceil(employeeFixtures.length / batchSize);

  for (let b = 0; b < totalBatches; b++) {
    const start = b * batchSize;
    const end = Math.min(start + batchSize, employeeFixtures.length);
    const batchFixtures = employeeFixtures.slice(start, end);

    // Build parallel request array
    const requests = batchFixtures.map((fixture) => ({
      method: 'POST',
      url: `${employeeUrl}/employees`,
      body: JSON.stringify(fixture),
      params: { headers },
    }));

    const responses = http.batch(requests);

    for (const res of responses) {
      if (res.status === 201) {
        employeeIds.push(res.json('employeeId'));
      } else {
        console.warn(
          `Employee create returned ${res.status}: ${res.body.slice(0, 200)}`,
        );
      }
    }

    console.log(
      `Employees: batch ${b + 1}/${totalBatches} done ` +
        `(${employeeIds.length}/${employeeFixtures.length} created)`,
    );
  }

  return employeeIds;
}
