import { EmployeeId } from '../../domain/employee-id';
import { Employee } from '../../domain/employee.entity';
import type { EmployeeRepository } from '../../domain/employee.repository';
import { EmployeeNotFoundError } from '../errors';

/**
 * Query to retrieve a single employee by their unique identifier.
 *
 * Returns the full Employee aggregate for the given ID.
 */
export class GetEmployeeQuery {
  constructor(public readonly employeeId: string) {}
}

/**
 * Handler for the GetEmployeeQuery.
 *
 * Finds the employee by ID and returns the full Employee aggregate.
 * Throws EmployeeNotFoundError if the employee does not exist.
 */
export class GetEmployeeHandler {
  constructor(
    private readonly employeeRepository: EmployeeRepository,
  ) {}

  /**
   * Executes the get-employee query.
   *
   * @param query - The query containing the employee ID to look up.
   * @returns The Employee aggregate.
   * @throws {EmployeeNotFoundError} If the employee does not exist.
   */
  async execute(query: GetEmployeeQuery): Promise<Employee> {
    const id = EmployeeId.from(query.employeeId);
    const employee = await this.employeeRepository.findById(id);

    if (!employee) {
      throw new EmployeeNotFoundError(query.employeeId);
    }

    return employee;
  }
}
