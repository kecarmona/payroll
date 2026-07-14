import { EmployeeId } from '../domain/employee-id';
import type { EmployeeRepository } from '../domain/employee.repository';
import type { EventPublisher } from '../domain/event-publisher';
import { EmployeeNotFoundError } from './errors';

/**
 * Command to terminate an employee's employment.
 *
 * Termination is idempotent — terminating an already terminated employee
 * is a no-op. The handler records an EmployeeTerminated domain event only
 * when the state actually changes.
 */
export class TerminateEmployeeCommand {
  constructor(public readonly employeeId: string) {}
}

/**
 * Handler for the TerminateEmployeeCommand.
 *
 * Finds the employee by ID, calls terminate() on the aggregate (which
 * records an EmployeeTerminated event if the employee was active),
 * persists the change, and publishes the recorded events.
 */
export class TerminateEmployeeHandler {
  constructor(
    private readonly employeeRepository: EmployeeRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  /**
   * Executes the terminate-employee command.
   *
   * @param command - The command containing the employeeId to terminate.
   * @throws {EmployeeNotFoundError} If the employee does not exist.
   */
  async execute(command: TerminateEmployeeCommand): Promise<void> {
    const id = EmployeeId.from(command.employeeId);
    const employee = await this.employeeRepository.findById(id);

    if (!employee) {
      throw new EmployeeNotFoundError(command.employeeId);
    }

    employee.terminate();

    await this.employeeRepository.save(employee);

    const events = employee.pullEvents();
    for (const event of events) {
      await this.eventPublisher.publish(event);
    }
  }
}
