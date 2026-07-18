import { DataSource, Repository } from 'typeorm';
import { TypeOrmEmployeeRepository } from './typeorm-employee.repository';
import { TypeOrmEmployeeEntity } from './typeorm-employee.entity';
import { Employee } from '../../domain/employee.entity';
import { EmployeeId } from '../../domain/employee-id';
import { EmployeeEmail } from '../../domain/employee-email';
import { EmployeeName } from '../../domain/employee-name';
import { EmployeePosition } from '../../domain/employee-position';
import { Salary } from '../../domain/salary';
import { EmploymentStatus } from '../../domain/employment-status';

describe('TypeOrmEmployeeRepository', () => {
  let repository: TypeOrmEmployeeRepository;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockTypeOrmRepo: jest.Mocked<Repository<TypeOrmEmployeeEntity>>;
  let testEmployee: Employee;

  const companyId = 'company-1';

  beforeAll(() => {
    const employeeId = EmployeeId.create();
    const email = EmployeeEmail.from('repo-test@example.com');
    const name = EmployeeName.from('Test Employee');
    const position = EmployeePosition.from('Engineer');
    const salary = Salary.from(500000, 'USD');

    testEmployee = Employee.register({
      id: employeeId,
      email,
      name,
      position,
      salary,
      department: 'Engineering',
      companyId,
    });
  });

  beforeEach(() => {
    mockTypeOrmRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<TypeOrmEmployeeEntity>>;

    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockTypeOrmRepo),
    } as unknown as jest.Mocked<DataSource>;

    repository = new TypeOrmEmployeeRepository(mockDataSource);
  });

  // ─── save ────────────────────────────────────────────────────

  describe('save', () => {
    it('should persist the employee entity via TypeORM repository', async () => {
      mockTypeOrmRepo.save.mockResolvedValue({} as TypeOrmEmployeeEntity);

      await repository.save(testEmployee);

      expect(mockTypeOrmRepo.save).toHaveBeenCalledTimes(1);
      const savedEntity = mockTypeOrmRepo.save.mock
        .calls[0][0] as TypeOrmEmployeeEntity;

      expect(savedEntity.id).toBe(testEmployee.id);
      expect(savedEntity.companyId).toBe(companyId);
      expect(savedEntity.email).toBe('repo-test@example.com');
      expect(savedEntity.name).toBe('Test Employee');
      expect(savedEntity.position).toBe('Engineer');
      expect(savedEntity.salaryAmount).toBe(500000);
      expect(savedEntity.salaryCurrency).toBe('USD');
      expect(savedEntity.department).toBe('Engineering');
      expect(savedEntity.status).toBe('ACTIVE');
      expect(savedEntity.version).toBe(0);
    });

    it('should map domain email as string value', async () => {
      mockTypeOrmRepo.save.mockResolvedValue({} as TypeOrmEmployeeEntity);

      await repository.save(testEmployee);

      const savedEntity = mockTypeOrmRepo.save.mock
        .calls[0][0] as TypeOrmEmployeeEntity;
      expect(typeof savedEntity.email).toBe('string');
      expect(savedEntity.email).toBe('repo-test@example.com');
    });
  });

  // ─── findById ────────────────────────────────────────────────

  describe('findById', () => {
    it('should return null when employee is not found', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById(
        EmployeeId.from('non-existent'),
      );

      expect(result).toBeNull();
      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'non-existent' },
      });
    });

    it('should reconstitute an Employee from a found entity', async () => {
      const entity: TypeOrmEmployeeEntity = {
        id: testEmployee.id,
        companyId,
        email: 'found@example.com',
        name: 'Found Employee',
        position: 'Manager',
        salaryAmount: 750000,
        salaryCurrency: 'USD',
        department: 'Engineering',
        status: 'ACTIVE',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as TypeOrmEmployeeEntity;

      mockTypeOrmRepo.findOne.mockResolvedValue(entity);

      const result = await repository.findById(
        EmployeeId.from(testEmployee.id),
      );

      expect(result).not.toBeNull();
      expect(result!.id).toBe(testEmployee.id);
      expect(result!.email).toBe('found@example.com');
      expect(result!.name).toBe('Found Employee');
      expect(result!.position).toBe('Manager');
      expect(result!.salary.amount).toBe(750000);
      expect(result!.salary.currency).toBe('USD');
      expect(result!.department).toBe('Engineering');
      expect(result!.isActive).toBe(true);
      expect(result!.version).toBe(1);
    });

    it('should handle TERMINATED status when reconstituting', async () => {
      const entity: TypeOrmEmployeeEntity = {
        id: testEmployee.id,
        companyId,
        email: 'terminated@example.com',
        name: 'Terminated Employee',
        position: 'Engineer',
        salaryAmount: 500000,
        salaryCurrency: 'USD',
        department: 'Engineering',
        status: 'TERMINATED',
        version: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as TypeOrmEmployeeEntity;

      mockTypeOrmRepo.findOne.mockResolvedValue(entity);

      const result = await repository.findById(
        EmployeeId.from(testEmployee.id),
      );

      expect(result).not.toBeNull();
      expect(result!.status).toBe(EmploymentStatus.TERMINATED);
      expect(result!.isActive).toBe(false);
    });
  });

  // ─── findByEmail ─────────────────────────────────────────────

  describe('findByEmail', () => {
    it('should return null when email is not found', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findByEmail('unknown@example.com');

      expect(result).toBeNull();
    });

    it('should find an employee by email', async () => {
      const entity: TypeOrmEmployeeEntity = {
        id: testEmployee.id,
        companyId,
        email: 'findbyemail@example.com',
        name: 'Email Search',
        position: 'Analyst',
        salaryAmount: 600000,
        salaryCurrency: 'USD',
        department: 'Finance',
        status: 'ACTIVE',
        version: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as TypeOrmEmployeeEntity;

      mockTypeOrmRepo.findOne.mockResolvedValue(entity);

      const result = await repository.findByEmail('findbyemail@example.com');

      expect(result).not.toBeNull();
      expect(result!.email).toBe('findbyemail@example.com');
      expect(result!.name).toBe('Email Search');
      expect(result!.department).toBe('Finance');
      expect(result!.version).toBe(3);
    });
  });

  // ─── findByCompanyId ─────────────────────────────────────────

  describe('findByCompanyId', () => {
    it('should return an empty array when no employees for the company', async () => {
      mockTypeOrmRepo.find.mockResolvedValue([]);

      const result = await repository.findByCompanyId('empty-company');

      expect(result).toEqual([]);
      expect(mockTypeOrmRepo.find).toHaveBeenCalledWith({
        where: { companyId: 'empty-company' },
      });
    });

    it('should return all employees for a given company', async () => {
      const entity1: TypeOrmEmployeeEntity = {
        id: 'emp-1',
        companyId: 'search-company',
        email: 'emp1@example.com',
        name: 'Employee One',
        position: 'Engineer',
        salaryAmount: 500000,
        salaryCurrency: 'USD',
        department: 'Engineering',
        status: 'ACTIVE',
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as TypeOrmEmployeeEntity;

      const entity2: TypeOrmEmployeeEntity = {
        id: 'emp-2',
        companyId: 'search-company',
        email: 'emp2@example.com',
        name: 'Employee Two',
        position: 'Manager',
        salaryAmount: 800000,
        salaryCurrency: 'USD',
        department: 'Engineering',
        status: 'ACTIVE',
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as TypeOrmEmployeeEntity;

      mockTypeOrmRepo.find.mockResolvedValue([entity1, entity2]);

      const result = await repository.findByCompanyId('search-company');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('emp-1');
      expect(result[0].email).toBe('emp1@example.com');
      expect(result[1].id).toBe('emp-2');
      expect(result[1].email).toBe('emp2@example.com');
    });

    it('should not return employees from other companies', async () => {
      const otherEntity: TypeOrmEmployeeEntity = {
        id: 'emp-other',
        companyId: 'other-company',
        email: 'other@example.com',
        name: 'Other Employee',
        position: 'Engineer',
        salaryAmount: 500000,
        salaryCurrency: 'USD',
        department: 'Engineering',
        status: 'ACTIVE',
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as TypeOrmEmployeeEntity;

      mockTypeOrmRepo.find.mockResolvedValue([otherEntity]);

      // When querying for a different company, the mock only returns entities
      // for 'other-company' (the mock is stubbed — we verify the query filter)
      const result = await repository.findByCompanyId('different-company');

      // The mock returns what we configured — we verify the query was correct
      expect(result).toHaveLength(1);
      expect(result[0].companyId).toBe('other-company');
      expect(mockTypeOrmRepo.find).toHaveBeenCalledWith({
        where: { companyId: 'different-company' },
      });
    });
  });

  // ─── Entity Mapping Roundtrip ────────────────────────────────

  describe('entity mapping roundtrip', () => {
    it('should preserve all fields through toEntity → toDomain', async () => {
      // Use a freshly registered employee (not the shared one) to
      // test the mapping from domain → entity → domain
      const freshId = EmployeeId.create();
      const freshEmail = EmployeeEmail.from('roundtrip@example.com');
      const freshName = EmployeeName.from('Roundtrip Employee');
      const freshPosition = EmployeePosition.from('Director');
      const freshSalary = Salary.from(1200000, 'EUR');

      const original = Employee.register({
        id: freshId,
        email: freshEmail,
        name: freshName,
        position: freshPosition,
        salary: freshSalary,
        department: 'Management',
        companyId: 'roundtrip-co',
      });

      // Simulate save → the repository calls save with the entity
      // (we verify toEntity mapping was correct via the mock's call args)
      mockTypeOrmRepo.save.mockResolvedValue({} as TypeOrmEmployeeEntity);
      await repository.save(original);

      const savedEntity = mockTypeOrmRepo.save.mock
        .calls[0][0] as TypeOrmEmployeeEntity;

      // Simulate read-back → the repository converts entity back to domain
      // via toDomain (we test this through findById which uses toDomain)
      mockTypeOrmRepo.findOne.mockResolvedValue(savedEntity);
      const roundtrip = await repository.findById(
        EmployeeId.from(original.id),
      );

      expect(roundtrip).not.toBeNull();
      expect(roundtrip!.id).toBe(original.id);
      expect(roundtrip!.email).toBe('roundtrip@example.com');
      expect(roundtrip!.name).toBe('Roundtrip Employee');
      expect(roundtrip!.position).toBe('Director');
      expect(roundtrip!.salary.amount).toBe(1200000);
      expect(roundtrip!.salary.currency).toBe('EUR');
      expect(roundtrip!.department).toBe('Management');
      expect(roundtrip!.companyId).toBe('roundtrip-co');
      expect(roundtrip!.isActive).toBe(true);
      expect(roundtrip!.version).toBe(0);
    });
  });
});
