import { v4 as uuid } from 'uuid';

/**
 * Test data fixture factory.
 *
 * Generates unique, valid payloads for each service endpoint.
 * Every call produces fresh UUID-based identifiers to prevent
 * cross-run collisions and allow parallel test execution.
 */

/** A set of default employee salary configurations for variety. */
const SALARY_PROFILES = [
  { salaryAmount: 75000_00, salaryCurrency: 'USD', position: 'Senior Engineer', department: 'Engineering' },
  { salaryAmount: 65000_00, salaryCurrency: 'USD', position: 'Marketing Manager', department: 'Marketing' },
  { salaryAmount: 55000_00, salaryCurrency: 'USD', position: 'HR Coordinator', department: 'Human Resources' },
  { salaryAmount: 90000_00, salaryCurrency: 'USD', position: 'Principal Architect', department: 'Engineering' },
  { salaryAmount: 48000_00, salaryCurrency: 'USD', position: 'Junior Analyst', department: 'Finance' },
];

/** Supported roles for user registration. */
export type UserRole = 'ADMIN' | 'HR' | 'EMPLOYEE';

/** Shape returned by createUserFixture. */
export interface UserFixture {
  email: string;
  password: string;
  role: UserRole;
  name: string;
  companyId: string;
}

/** Shape returned by createEmployeeFixture. */
export interface EmployeeFixture {
  name: string;
  email: string;
  position: string;
  salaryAmount: number;
  salaryCurrency: string;
  department: string;
  companyId: string;
}

/** Shape returned by createPeriodFixture. */
export interface PeriodFixture {
  companyId: string;
  month: number;
  year: number;
  startDate: string;
  endDate: string;
}

/** Shape returned by createJobFixture. */
export interface JobFixture {
  companyId: string;
  periodId: string;
  employeeIds?: string[];
}

/**
 * Generates a unique user registration payload.
 *
 * @param overrides - Optional field overrides.
 * @returns A complete user registration DTO body.
 */
export function createUserFixture(overrides?: Partial<UserFixture>): UserFixture {
  const uniqueId = uuid().slice(0, 8);
  return {
    email: `hr-user-${uniqueId}@test-payroll.com`,
    password: 'TestPass123!',
    role: 'HR',
    name: `Test HR User ${uniqueId}`,
    companyId: 'default-company',
    ...overrides,
  };
}

/**
 * Generates a unique employee creation payload.
 *
 * Cycles through predefined salary profiles for variety.
 *
 * @param companyId - The tenant/company identifier.
 * @param index - Optional index for cycling through salary profiles.
 * @returns A complete employee creation DTO body.
 */
export function createEmployeeFixture(companyId: string, index = 0): EmployeeFixture {
  const uniqueId = uuid().slice(0, 8);
  const profile = SALARY_PROFILES[index % SALARY_PROFILES.length];
  return {
    name: `Employee ${uniqueId}`,
    email: `employee-${uniqueId}@test-payroll.com`,
    position: profile.position,
    salaryAmount: profile.salaryAmount,
    salaryCurrency: profile.salaryCurrency,
    department: profile.department,
    companyId,
  };
}

/**
 * Generates a payroll period payload for the current month.
 *
 * Computes month/year/startDate/endDate from the current date for
 * a full-month period. This ensures the period is always valid
 * (not in the past, not in the far future).
 *
 * @param companyId - The tenant/company identifier.
 * @returns A complete create-payroll-period DTO body.
 */
export function createPeriodFixture(companyId: string): PeriodFixture {
  const now = new Date();
  // Use next month to avoid "already exists" conflicts
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

/**
 * Generates a payroll job creation payload.
 *
 * @param companyId - The tenant/company identifier.
 * @param periodId - The target payroll period ID.
 * @returns A complete create-payroll-job DTO body.
 */
export function createJobFixture(companyId: string, periodId: string, employeeIds?: string[]): JobFixture {
  return { companyId, periodId, employeeIds };
}
