import { Employee } from '../../domain/employee.entity';
import type { EmployeeRepository } from '../../domain/employee.repository';

/**
 * Query to list all employees belonging to a specific company.
 */
export class ListEmployeesQuery {
  constructor(public readonly companyId: string) {}
}

/**
 * Handler for the ListEmployeesQuery.
 *
 * Retrieves all employees for the given company ID from the repository.
 * Returns an empty array when no employees match the company.
 */
export class ListEmployeesHandler {
  constructor(
    private readonly employeeRepository: EmployeeRepository,
  ) {}

  /**
   * Executes the list-employees query.
   *
   * @param query - The query containing the company ID to filter by.
   * @returns An array of Employee aggregates for the company.
   */
  async execute(query: ListEmployeesQuery): Promise<Employee[]> {
    return this.employeeRepository.findByCompanyId(query.companyId);
  }
}
