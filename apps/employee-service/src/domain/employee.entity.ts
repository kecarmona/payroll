import { AggregateRoot, ValidationError } from '@payroll/shared-kernel';
import { EmployeeId } from './employee-id';
import { EmployeeEmail } from './employee-email';
import { EmployeeName } from './employee-name';
import { EmployeePosition } from './employee-position';
import { Salary } from './salary';
import { EmploymentStatus } from './employment-status';
import { EmployeeCreatedEvent } from './events/employee-created.event';
import { EmployeeUpdatedEvent } from './events/employee-updated.event';
import { EmployeeSalaryChangedEvent } from './events/employee-salary-changed.event';
import { EmployeeTerminatedEvent } from './events/employee-terminated.event';

/**
 * Employee aggregate root — the central entity of the Employee bounded context.
 *
 * The Employee aggregate manages employee lifecycle including personal data
 * updates, salary changes, and employment termination. It records domain events
 * for every state change that must be propagated to other bounded contexts.
 *
 * @example
 * ```ts
 * const employee = Employee.register({
 *   id: EmployeeId.create(),
 *   email: EmployeeEmail.from('john@example.com'),
 *   name: EmployeeName.from('John Doe'),
 *   position: EmployeePosition.from('Engineer'),
 *   salary: Salary.from(500000, 'USD'),
 *   department: 'Engineering',
 * });
 * ```
 */
export class Employee extends AggregateRoot<string> {
  private readonly _email: EmployeeEmail;
  private readonly _name: EmployeeName;
  private readonly _position: EmployeePosition;
  private readonly _salary: Salary;
  private readonly _department: string;
  private readonly _status: EmploymentStatus;

  private constructor(
    id: string,
    email: EmployeeEmail,
    name: EmployeeName,
    position: EmployeePosition,
    salary: Salary,
    department: string,
    status: EmploymentStatus,
    companyId: string,
    version?: number,
  ) {
    super(id, companyId, version);
    this._email = email;
    this._name = name;
    this._position = position;
    this._salary = salary;
    this._department = department;
    this._status = status;
  }

  // ─── Getters ─────────────────────────────────────────────────

  /** Returns the employee's email address. */
  get email(): string {
    return this._email.value;
  }

  /** Returns the employee's full name. */
  get name(): string {
    return this._name.value;
  }

  /** Returns the employee's position/title. */
  get position(): string {
    return this._position.value;
  }

  /** Returns the employee's current salary. */
  get salary(): Salary {
    return this._salary;
  }

  /** Returns the employee's department. */
  get department(): string {
    return this._department;
  }

  /** Returns the employee's current employment status. */
  get status(): EmploymentStatus {
    return this._status;
  }

  /** Whether the employee is actively employed. */
  get isActive(): boolean {
    return this._status === EmploymentStatus.ACTIVE;
  }

  // ─── Factory Methods ──────────────────────────────────────────

  /**
   * Reconstitutes an Employee from persisted data.
   *
   * This is the reconstruction path used by repositories when loading
   * employees from the database, bypassing the registration flow.
   *
   * @param props - All persisted properties of the employee.
   * @returns A reconstituted Employee instance.
   */
  static reconstitute(props: {
    id: string;
    email: EmployeeEmail;
    name: EmployeeName;
    position: EmployeePosition;
    salary: Salary;
    department: string;
    status: EmploymentStatus;
    companyId: string;
    version: number;
  }): Employee {
    return new Employee(
      props.id,
      props.email,
      props.name,
      props.position,
      props.salary,
      props.department,
      props.status,
      props.companyId,
      props.version,
    );
  }

  /**
   * Registers a new employee in the system.
   *
   * Creates the Employee aggregate with ACTIVE status and records an
   * `EmployeeCreatedEvent` for publication.
   *
   * @param props - The properties for the new employee.
   * @returns A new active Employee instance with a recorded EmployeeCreated event.
   */
  static register(props: {
    id: EmployeeId;
    email: EmployeeEmail;
    name: EmployeeName;
    position: EmployeePosition;
    salary: Salary;
    department: string;
    companyId: string;
  }): Employee {
    const employee = new Employee(
      props.id.toString(),
      props.email,
      props.name,
      props.position,
      props.salary,
      props.department,
      EmploymentStatus.ACTIVE,
      props.companyId,
      0,
    );

    employee.recordEvent(
      new EmployeeCreatedEvent({
        employeeId: props.id.toString(),
        name: props.name.value,
        email: props.email.value,
        companyId: employee.companyId,
        position: props.position.value,
        department: props.department,
        salaryCents: props.salary.amount,
        salaryCurrency: props.salary.currency,
      }),
    );

    return employee;
  }

  // ─── Business Methods ─────────────────────────────────────────

  /**
   * Updates the employee's personal data fields.
   *
   * Records an `EmployeeUpdatedEvent` listing which fields changed.
   *
   * @param name     - The new name.
   * @param position - The new position/title.
   * @param department - The new department.
   * @throws {ValidationError} If the employee is terminated.
   */
  updateData(
    name: EmployeeName,
    position: EmployeePosition,
    department: string,
  ): void {
    this.assertNotTerminated();

    const changedFields: string[] = [];

    if (name.value !== this._name.value) {
      changedFields.push('name');
    }
    if (position.value !== this._position.value) {
      changedFields.push('position');
    }
    if (department !== this._department) {
      changedFields.push('department');
    }

    // Copy updated state to this instance (mutation)
    (this as unknown as { _name: EmployeeName })._name = name;
    (this as unknown as { _position: EmployeePosition })._position = position;
    (this as unknown as { _department: string })._department = department;

    this.recordEvent(
      new EmployeeUpdatedEvent({
        employeeId: this.id,
        companyId: this.companyId,
        changedFields,
        updatedAt: new Date().toISOString(),
      }),
    );
  }

  /**
   * Changes the employee's salary.
   *
   * Records an `EmployeeSalaryChangedEvent` with previous and new salary details.
   *
   * @param newSalary     - The new salary value.
   * @param effectiveDate - The date the salary change takes effect (ISO string).
   * @throws {ValidationError} If the employee is terminated.
   */
  changeSalary(newSalary: Salary, effectiveDate: string): void {
    this.assertNotTerminated();

    const previousSalary = this._salary;

    (this as unknown as { _salary: Salary })._salary = newSalary;

    this.recordEvent(
      new EmployeeSalaryChangedEvent({
        employeeId: this.id,
        companyId: this.companyId,
        previousSalaryCents: previousSalary.amount,
        newSalaryCents: newSalary.amount,
        currency: newSalary.currency,
        effectiveDate,
      }),
    );
  }

  /**
   * Terminates the employee's employment.
   *
   * Records an `EmployeeTerminatedEvent`. Idempotent — calling terminate on
   * an already terminated employee does nothing.
   */
  terminate(): void {
    if (this._status === EmploymentStatus.TERMINATED) {
      return; // idempotent
    }

    (this as unknown as { _status: EmploymentStatus })._status =
      EmploymentStatus.TERMINATED;

    this.recordEvent(
      new EmployeeTerminatedEvent({
        employeeId: this.id,
        companyId: this.companyId,
      }),
    );
  }

  // ─── Private Helpers ──────────────────────────────────────────

  /**
   * Asserts that the employee is not terminated.
   *
   * @throws {ValidationError} If the employee is terminated.
   */
  private assertNotTerminated(): void {
    if (this._status === EmploymentStatus.TERMINATED) {
      throw new ValidationError(
        'employee',
        `Employee "${this.id}" is terminated and cannot be modified`,
      );
    }
  }
}
