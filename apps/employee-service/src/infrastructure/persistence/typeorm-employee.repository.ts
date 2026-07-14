import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Employee } from '../../domain/employee.entity';
import { EmployeeId } from '../../domain/employee-id';
import { EmployeeEmail } from '../../domain/employee-email';
import { EmployeeName } from '../../domain/employee-name';
import { EmployeePosition } from '../../domain/employee-position';
import { Salary } from '../../domain/salary';
import { EmploymentStatus } from '../../domain/employment-status';
import type { EmployeeRepository } from '../../domain/employee.repository';
import { TypeOrmEmployeeEntity } from './typeorm-employee.entity';

/**
 * TypeORM-backed implementation of the {@link EmployeeRepository} port.
 *
 * Converts between the domain {@link Employee} aggregate and the
 * {@link TypeOrmEmployeeEntity} persistence model. Uses the TypeORM
 * {@link Repository} pattern via {@link DataSource}.
 *
 * The repository handles the mapping of domain value objects to plain
 * database columns and vice versa.
 */
@Injectable()
export class TypeOrmEmployeeRepository implements EmployeeRepository {
  private readonly repository: Repository<TypeOrmEmployeeEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = dataSource.getRepository(TypeOrmEmployeeEntity);
  }

  /**
   * Persists an Employee aggregate.
   *
   * Creates a new record if the employee does not exist, or updates an
   * existing record. TypeORM's {@link Repository.save} uses the primary
   * key to determine insert vs. update and checks the version column for
   * optimistic concurrency control.
   *
   * @param employee - The Employee aggregate to save.
   */
  async save(employee: Employee): Promise<void> {
    const entity = this.toEntity(employee);
    await this.repository.save(entity);
  }

  /**
   * Finds an employee by their unique identifier.
   *
   * @param id - The EmployeeId to search for.
   * @returns The Employee aggregate, or `null` if not found.
   */
  async findById(id: EmployeeId): Promise<Employee | null> {
    const entity = await this.repository.findOne({
      where: { id: id.toString() },
    });

    return entity ? this.toDomain(entity) : null;
  }

  /**
   * Finds an employee by their email address.
   *
   * @param email - The email address to search for.
   * @returns The Employee aggregate, or `null` if not found.
   */
  async findByEmail(email: string): Promise<Employee | null> {
    const entity = await this.repository.findOne({
      where: { email },
    });

    return entity ? this.toDomain(entity) : null;
  }

  /**
   * Finds all employees belonging to a company.
   *
   * @param companyId - The company/tenant identifier.
   * @returns An array of Employee aggregates for the company.
   */
  async findByCompanyId(companyId: string): Promise<Employee[]> {
    const entities = await this.repository.find({
      where: { companyId },
    });

    return entities.map((entity) => this.toDomain(entity));
  }

  /**
   * Converts a domain Employee to a TypeORM entity for persistence.
   *
   * @param employee - The domain Employee aggregate.
   * @returns A TypeORM entity ready for persistence.
   */
  private toEntity(employee: Employee): TypeOrmEmployeeEntity {
    const entity = new TypeOrmEmployeeEntity();
    entity.id = employee.id;
    entity.companyId = employee.companyId;
    entity.email = employee.email;
    entity.name = employee.name;
    entity.position = employee.position;
    entity.salaryAmount = employee.salary.amount;
    entity.salaryCurrency = employee.salary.currency;
    entity.department = employee.department;
    entity.status = employee.status.value;
    entity.version = employee.version;
    return entity;
  }

  /**
   * Converts a TypeORM entity back to a domain Employee aggregate.
   *
   * Uses the domain's static `reconstitute` factory to bypass the
   * registration flow, creating the Employee without recording events.
   *
   * @param entity - The TypeORM entity from the database.
   * @returns A reconstituted domain Employee aggregate.
   */
  private toDomain(entity: TypeOrmEmployeeEntity): Employee {
    return Employee.reconstitute({
      id: entity.id,
      email: EmployeeEmail.from(entity.email ?? ''),
      name: EmployeeName.from(entity.name),
      position: EmployeePosition.from(entity.position),
      salary: Salary.from(entity.salaryAmount, entity.salaryCurrency),
      department: entity.department,
      status: this.toDomainStatus(entity.status),
      companyId: entity.companyId,
      version: entity.version,
    });
  }

  /**
   * Converts a status string from the database to an EmploymentStatus
   * value object.
   *
   * @param value - The status string ('ACTIVE' or 'TERMINATED').
   * @returns The corresponding EmploymentStatus value object.
   */
  private toDomainStatus(value: string): EmploymentStatus {
    switch (value) {
      case 'TERMINATED':
        return EmploymentStatus.TERMINATED;
      case 'ACTIVE':
      default:
        return EmploymentStatus.ACTIVE;
    }
  }
}
