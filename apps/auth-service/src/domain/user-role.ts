/**
 * Roles available within the Identity bounded context.
 *
 * Each role defines a set of permissions for authorization decisions.
 *
 * - `ADMIN` — Full system access, can manage all resources.
 * - `HR` — Human Resources, can manage employees and payroll operations.
 * - `EMPLOYEE` — Standard user, can access own data and payslips.
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  HR = 'HR',
  EMPLOYEE = 'EMPLOYEE',
}
