import { Employee } from '../domain/employee.entity';
import { EmployeeId } from '../domain/employee-id';
import { EmployeeEmail } from '../domain/employee-email';
import { EmployeeName } from '../domain/employee-name';
import { EmployeePosition } from '../domain/employee-position';
import { Salary } from '../domain/salary';
import type { EmployeeRepository } from '../domain/employee.repository';
import type { EventPublisher } from '../domain/event-publisher';
import { EmployeeAlreadyExistsError } from './errors';

/**
 * Command to register a new employee in the system.
 *
 * Contains all essential registration data: email, name, position,
 * salary details, department, and the tenant (company) the employee belongs to.
 */
export class CreateEmployeeCommand {
  constructor(
    public readonly email: string,
    public readonly name: string,
    public readonly position: string,
    public readonly salaryAmount: number,
    public readonly salaryCurrency: string,
    public readonly department: string,
    public readonly companyId: string,
  ) {}
}

/**
 * Handler for the CreateEmployeeCommand.
 *
 * Validates that the email is not already registered, creates the
 * Employee aggregate (which records an EmployeeCreated domain event),
 * persists the employee, and publishes the recorded events.
 */
export class CreateEmployeeHandler {
  constructor(
    private readonly employeeRepository: EmployeeRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  /**
   * Executes the create-employee command.
   *
   * @param command - The employee registration details.
   * @returns The newly created employee ID as a string.
   * @throws {EmployeeAlreadyExistsError} If the email is already registered.
   */
  async execute(command: CreateEmployeeCommand): Promise<string> {
    const existing = await this.employeeRepository.findByEmail(command.email);
    if (existing) {
      throw new EmployeeAlreadyExistsError(command.email);
    }

    const id = EmployeeId.create();
    const email = EmployeeEmail.from(command.email);
    const name = EmployeeName.from(command.name);
    const position = EmployeePosition.from(command.position);
    const salary = Salary.from(command.salaryAmount, command.salaryCurrency);

    const employee = Employee.register({
      id,
      email,
      name,
      position,
      salary,
      department: command.department,
      companyId: command.companyId,
    });

    await this.employeeRepository.save(employee);

    const events = employee.pullEvents();
    for (const event of events) {
      await this.eventPublisher.publish(event);
    }

    return id.toString();
  }
}
