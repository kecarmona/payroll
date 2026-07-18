/**
 * Auth helpers for k6 performance tests.
 *
 * Obtains a JWT token by logging in with hardcoded perf-test credentials.
 * On first run (user doesn't exist), it auto-registers before logging in.
 * Called once per test in setup() — returns the Bearer token string.
 *
 * ## Usage
 *
 * ```javascript
 * import { getToken } from '../lib/auth.js';
 *
 * export function setup() {
 *   const token = getToken();
 *   return { token };
 * }
 * ```
 */

import http from 'k6/http';
import { check } from 'k6';

const AUTH_URL = __ENV.AUTH_URL || 'http://localhost:3001';
const PERF_EMAIL = __ENV.PERF_EMAIL || 'perf-test@payroll.local';
const PERF_PASSWORD = __ENV.PERF_PASSWORD || 'perf-test-password';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

/**
 * Returns a JSON-serialized POST body for login.
 */
function loginBody() {
  return JSON.stringify({ email: PERF_EMAIL, password: PERF_PASSWORD });
}

/**
 * Returns a JSON-serialized POST body for registration.
 */
function registerBody() {
  return JSON.stringify({ email: PERF_EMAIL, password: PERF_PASSWORD, role: 'ADMIN' });
}

/**
 * Obtains a JWT Bearer token for the perf-test user.
 *
 * Tries login first. If the user doesn't exist (401), registers the
 * user and logs in again. The token is valid for the duration of the test.
 *
 * @returns {string} JWT access token.
 */
export function getToken() {
  // Step 1: Try logging in
  const loginRes = http.post(`${AUTH_URL}/auth/login`, loginBody(), {
    headers: JSON_HEADERS,
  });

  if (loginRes.status === 200) {
    console.log('Auth: login successful (existing user)');
    return loginRes.json('accessToken');
  }

  // Step 2: User doesn't exist yet — register
  console.log('Auth: user not found, registering...');
  const regRes = http.post(`${AUTH_URL}/auth/register`, registerBody(), {
    headers: JSON_HEADERS,
  });

  check(regRes, {
    'registration succeeded': (r) => r.status === 201,
  });

  if (regRes.status !== 201) {
    console.warn(
      `Auth: registration returned ${regRes.status}: ${regRes.body}`,
    );
  }

  // Step 3: Login after registration
  const loginRes2 = http.post(`${AUTH_URL}/auth/login`, loginBody(), {
    headers: JSON_HEADERS,
  });

  check(loginRes2, {
    'login after registration': (r) => r.status === 200,
  });

  return loginRes2.json('accessToken');
}
