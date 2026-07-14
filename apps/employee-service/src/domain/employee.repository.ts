import { Employee } from './employee.entity';
import { EmployeeId } from './employee-id';

/**
 * Port interface for Employee repository operations.
 *
 * Defines the contract for persisting and retrieving Employee aggregates.
 * The implementation lives in the infrastructure layer (TypeORM).
 */
export interface EmployeeRepository {
  /**
   * Persists an Employee aggregate.
   *
   * Creates a new record if the employee does not exist, or updates
   * an existing record. The implementation MUST check the version
   * field for optimistic concurrency control.
   *
   * @param employee - The Employee aggregate to save.
   */
  save(employee: Employee): Promise<void>;

  /**
   * Finds an employee by their unique identifier.
   *
   * @param id - The EmployeeId to search for.
   * @returns The Employee aggregate, or `null` if not found.
   */
  findById(id: EmployeeId): Promise<Employee | null>;

  /**
   * Finds an employee by their email address.
   *
   * @param email - The email address to search for.
   * @returns The Employee aggregate, or `null` if not found.
   */
  findByEmail(email: string): Promise<Employee | null>;

  /**
   * Finds all employees belonging to a company.
   *
   * @param companyId - The company/tenant identifier.
   * @returns An array of Employee aggregates for the company.
   */
  findByCompanyId(companyId: string): Promise<Employee[]>;
}
