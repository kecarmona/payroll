import { EmployeeId } from '../domain/employee-id';
import { Salary } from '../domain/salary';
import type { EmployeeRepository } from '../domain/employee.repository';
import type { EventPublisher } from '../domain/event-publisher';
import { EmployeeNotFoundError } from './errors';

/**
 * Command to change an employee's salary.
 *
 * Contains the employee identifier and the new salary details.
 * The employee must exist and must not be terminated.
 */
export class ChangeSalaryCommand {
  constructor(
    public readonly employeeId: string,
    public readonly newSalaryAmount: number,
    public readonly newSalaryCurrency: string,
  ) {}
}

/**
 * Handler for the ChangeSalaryCommand.
 *
 * Finds the employee by ID, calls changeSalary() on the aggregate (which
 * records an EmployeeSalaryChanged event with previous and new values),
 * persists the changes, and publishes the recorded events.
 */
export class ChangeSalaryHandler {
  constructor(
    private readonly employeeRepository: EmployeeRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  /**
   * Executes the change-salary command.
   *
   * @param command - The salary change details.
   * @throws {EmployeeNotFoundError} If the employee does not exist.
   */
  async execute(command: ChangeSalaryCommand): Promise<void> {
    const id = EmployeeId.from(command.employeeId);
    const employee = await this.employeeRepository.findById(id);

    if (!employee) {
      throw new EmployeeNotFoundError(command.employeeId);
    }

    const newSalary = Salary.from(command.newSalaryAmount, command.newSalaryCurrency);
    const effectiveDate = new Date().toISOString();

    employee.changeSalary(newSalary, effectiveDate);

    await this.employeeRepository.save(employee);

    const events = employee.pullEvents();
    for (const event of events) {
      await this.eventPublisher.publish(event);
    }
  }
}
