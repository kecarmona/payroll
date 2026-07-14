import { EmployeeId } from '../domain/employee-id';
import { EmployeeName } from '../domain/employee-name';
import { EmployeePosition } from '../domain/employee-position';
import type { EmployeeRepository } from '../domain/employee.repository';
import type { EventPublisher } from '../domain/event-publisher';
import { EmployeeNotFoundError } from './errors';

/**
 * Command to update an employee's personal data.
 *
 * Allows changing the employee's name, position, and department.
 * The employee must exist and must not be terminated.
 */
export class UpdateEmployeeCommand {
  constructor(
    public readonly employeeId: string,
    public readonly name: string,
    public readonly position: string,
    public readonly department: string,
  ) {}
}

/**
 * Handler for the UpdateEmployeeCommand.
 *
 * Finds the employee by ID, calls updateData() on the aggregate (which
 * records an EmployeeUpdated event with the list of changed fields),
 * persists the changes, and publishes the recorded events.
 */
export class UpdateEmployeeHandler {
  constructor(
    private readonly employeeRepository: EmployeeRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  /**
   * Executes the update-employee command.
   *
   * @param command - The update details.
   * @throws {EmployeeNotFoundError} If the employee does not exist.
   */
  async execute(command: UpdateEmployeeCommand): Promise<void> {
    const id = EmployeeId.from(command.employeeId);
    const employee = await this.employeeRepository.findById(id);

    if (!employee) {
      throw new EmployeeNotFoundError(command.employeeId);
    }

    const name = EmployeeName.from(command.name);
    const position = EmployeePosition.from(command.position);

    employee.updateData(name, position, command.department);

    await this.employeeRepository.save(employee);

    const events = employee.pullEvents();
    for (const event of events) {
      await this.eventPublisher.publish(event);
    }
  }
}
