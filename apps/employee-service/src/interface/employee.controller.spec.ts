import { Test, TestingModule } from '@nestjs/testing';
import { ValidationError } from '@payroll/shared-kernel';
import { CreateEmployeeHandler, CreateEmployeeCommand } from '../application/create-employee.command';
import { UpdateEmployeeHandler, UpdateEmployeeCommand } from '../application/update-employee.command';
import { ChangeSalaryHandler, ChangeSalaryCommand } from '../application/change-salary.command';
import { TerminateEmployeeHandler, TerminateEmployeeCommand } from '../application/terminate-employee.command';
import { GetEmployeeHandler, GetEmployeeQuery } from '../application/queries/get-employee.query';
import { ListEmployeesHandler, ListEmployeesQuery } from '../application/queries/list-employees.query';
import { EmployeeNotFoundError } from '../application/errors';
import { EmployeeController } from './employee.controller';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { ChangeSalaryDto } from './dto/change-salary.dto';
import { EmployeeResponseDto } from './dto/employee-response.dto';
import { Employee } from '../domain/employee.entity';
import { EmployeeId } from '../domain/employee-id';
import { EmployeeEmail } from '../domain/employee-email';
import { EmployeeName } from '../domain/employee-name';
import { EmployeePosition } from '../domain/employee-position';
import { Salary } from '../domain/salary';
import { EmploymentStatus } from '../domain/employment-status';

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('EmployeeController', () => {
  let controller: EmployeeController;
  let mockCreateHandler: jest.Mocked<CreateEmployeeHandler>;
  let mockUpdateHandler: jest.Mocked<UpdateEmployeeHandler>;
  let mockChangeSalaryHandler: jest.Mocked<ChangeSalaryHandler>;
  let mockTerminateHandler: jest.Mocked<TerminateEmployeeHandler>;
  let mockGetEmployeeHandler: jest.Mocked<GetEmployeeHandler>;
  let mockListEmployeesHandler: jest.Mocked<ListEmployeesHandler>;

  /** Builds a domain Employee for test assertions. */
  function buildEmployee(id: string, overrides: Partial<{
    email: string;
    name: string;
    position: string;
    salaryAmount: number;
    salaryCurrency: string;
    department: string;
    status: EmploymentStatus;
    companyId: string;
  }> = {}): Employee {
    return Employee.register({
      id: EmployeeId.from(id),
      email: EmployeeEmail.from(overrides.email ?? 'emp@example.com'),
      name: EmployeeName.from(overrides.name ?? 'Test Employee'),
      position: EmployeePosition.from(overrides.position ?? 'Engineer'),
      salary: Salary.from(overrides.salaryAmount ?? 500000, overrides.salaryCurrency ?? 'USD'),
      department: overrides.department ?? 'Engineering',
      companyId: overrides.companyId ?? 'company-1',
    });
  }

  beforeEach(async () => {
    mockCreateHandler = { execute: jest.fn() } as any;
    mockUpdateHandler = { execute: jest.fn() } as any;
    mockChangeSalaryHandler = { execute: jest.fn() } as any;
    mockTerminateHandler = { execute: jest.fn() } as any;
    mockGetEmployeeHandler = { execute: jest.fn() } as any;
    mockListEmployeesHandler = { execute: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeController],
      providers: [
        { provide: CreateEmployeeHandler, useValue: mockCreateHandler },
        { provide: UpdateEmployeeHandler, useValue: mockUpdateHandler },
        { provide: ChangeSalaryHandler, useValue: mockChangeSalaryHandler },
        { provide: TerminateEmployeeHandler, useValue: mockTerminateHandler },
        { provide: GetEmployeeHandler, useValue: mockGetEmployeeHandler },
        { provide: ListEmployeesHandler, useValue: mockListEmployeesHandler },
      ],
    }).compile();

    controller = module.get<EmployeeController>(EmployeeController);
  });

  // ─── POST /employees ───────────────────────────────────────────

  describe('POST /employees', () => {
    it('should call CreateEmployeeHandler and return the employeeId', async () => {
      mockCreateHandler.execute.mockResolvedValue('new-employee-id');

      const dto = new CreateEmployeeDto();
      Object.assign(dto, {
        email: 'new-hire@example.com',
        name: 'Jane Hire',
        position: 'Engineer',
        salaryAmount: 600000,
        salaryCurrency: 'USD',
        department: 'Engineering',
        companyId: 'company-1',
      });

      const result = await controller.create(dto);

      expect(result).toEqual({ employeeId: 'new-employee-id' });
      expect(mockCreateHandler.execute).toHaveBeenCalledTimes(1);
      expect(mockCreateHandler.execute).toHaveBeenCalledWith(
        expect.any(CreateEmployeeCommand),
      );

      const command = mockCreateHandler.execute.mock.calls[0][0] as CreateEmployeeCommand;
      expect(command.email).toBe('new-hire@example.com');
      expect(command.name).toBe('Jane Hire');
      expect(command.position).toBe('Engineer');
      expect(command.salaryAmount).toBe(600000);
      expect(command.salaryCurrency).toBe('USD');
      expect(command.department).toBe('Engineering');
      expect(command.companyId).toBe('company-1');
    });

    it('should propagate ValidationError from the handler', async () => {
      mockCreateHandler.execute.mockRejectedValue(
        new ValidationError('email', 'An employee with this email already exists'),
      );

      const dto = new CreateEmployeeDto();
      Object.assign(dto, {
        email: 'duplicate@example.com',
        name: 'Jane Hire',
        position: 'Engineer',
        salaryAmount: 600000,
        salaryCurrency: 'USD',
        department: 'Engineering',
        companyId: 'company-1',
      });

      await expect(controller.create(dto)).rejects.toThrow(ValidationError);
    });
  });

  // ─── PATCH /employees/:id ──────────────────────────────────────

  describe('PATCH /employees/:id', () => {
    it('should call UpdateEmployeeHandler with the employeeId and dto data', async () => {
      mockUpdateHandler.execute.mockResolvedValue(undefined);

      const dto = new UpdateEmployeeDto();
      Object.assign(dto, { name: 'Updated Name', position: 'Senior Engineer', department: 'Product' });

      await controller.update('emp-123', dto);

      expect(mockUpdateHandler.execute).toHaveBeenCalledTimes(1);
      expect(mockUpdateHandler.execute).toHaveBeenCalledWith(
        expect.any(UpdateEmployeeCommand),
      );

      const command = mockUpdateHandler.execute.mock.calls[0][0] as UpdateEmployeeCommand;
      expect(command.employeeId).toBe('emp-123');
      expect(command.name).toBe('Updated Name');
      expect(command.position).toBe('Senior Engineer');
      expect(command.department).toBe('Product');
    });

    it('should propagate EmployeeNotFoundError from the handler', async () => {
      mockUpdateHandler.execute.mockRejectedValue(
        new EmployeeNotFoundError('non-existent'),
      );

      const dto = new UpdateEmployeeDto();
      Object.assign(dto, { name: 'Nope' });

      await expect(controller.update('non-existent', dto)).rejects.toThrow(
        EmployeeNotFoundError,
      );
    });
  });

  // ─── PATCH /employees/:id/salary ───────────────────────────────

  describe('PATCH /employees/:id/salary', () => {
    it('should call ChangeSalaryHandler with the employeeId and dto data', async () => {
      mockChangeSalaryHandler.execute.mockResolvedValue(undefined);

      const dto = new ChangeSalaryDto();
      Object.assign(dto, { salaryAmount: 800000, salaryCurrency: 'USD' });

      await controller.changeSalary('emp-123', dto);

      expect(mockChangeSalaryHandler.execute).toHaveBeenCalledTimes(1);
      expect(mockChangeSalaryHandler.execute).toHaveBeenCalledWith(
        expect.any(ChangeSalaryCommand),
      );

      const command = mockChangeSalaryHandler.execute.mock.calls[0][0] as ChangeSalaryCommand;
      expect(command.employeeId).toBe('emp-123');
      expect(command.newSalaryAmount).toBe(800000);
      expect(command.newSalaryCurrency).toBe('USD');
    });

    it('should propagate EmployeeNotFoundError from the handler', async () => {
      mockChangeSalaryHandler.execute.mockRejectedValue(
        new EmployeeNotFoundError('non-existent'),
      );

      const dto = new ChangeSalaryDto();
      Object.assign(dto, { salaryAmount: 800000, salaryCurrency: 'USD' });

      await expect(controller.changeSalary('non-existent', dto)).rejects.toThrow(
        EmployeeNotFoundError,
      );
    });
  });

  // ─── POST /employees/:id/terminate ─────────────────────────────

  describe('POST /employees/:id/terminate', () => {
    it('should call TerminateEmployeeHandler with the employeeId', async () => {
      mockTerminateHandler.execute.mockResolvedValue(undefined);

      await controller.terminate('emp-123');

      expect(mockTerminateHandler.execute).toHaveBeenCalledTimes(1);
      expect(mockTerminateHandler.execute).toHaveBeenCalledWith(
        expect.any(TerminateEmployeeCommand),
      );

      const command = mockTerminateHandler.execute.mock.calls[0][0] as TerminateEmployeeCommand;
      expect(command.employeeId).toBe('emp-123');
    });

    it('should propagate EmployeeNotFoundError from the handler', async () => {
      mockTerminateHandler.execute.mockRejectedValue(
        new EmployeeNotFoundError('non-existent'),
      );

      await expect(controller.terminate('non-existent')).rejects.toThrow(
        EmployeeNotFoundError,
      );
    });
  });

  // ─── GET /employees/:id ────────────────────────────────────────

  describe('GET /employees/:id', () => {
    it('should call GetEmployeeHandler and return EmployeeResponseDto', async () => {
      const employee = buildEmployee('emp-123', {
        email: 'jane@example.com',
        name: 'Jane Doe',
        position: 'Manager',
        salaryAmount: 750000,
        salaryCurrency: 'USD',
        department: 'Engineering',
        companyId: 'company-1',
      });
      mockGetEmployeeHandler.execute.mockResolvedValue(employee);

      const result = await controller.getById('emp-123');

      expect(result).toBeInstanceOf(EmployeeResponseDto);
      expect(result.id).toBe('emp-123');
      expect(result.email).toBe('jane@example.com');
      expect(result.name).toBe('Jane Doe');
      expect(result.position).toBe('Manager');
      expect(result.salaryAmount).toBe(750000);
      expect(result.salaryCurrency).toBe('USD');
      expect(result.department).toBe('Engineering');
      expect(result.isActive).toBe(true);
      expect(mockGetEmployeeHandler.execute).toHaveBeenCalledWith(
        expect.any(GetEmployeeQuery),
      );

      const query = mockGetEmployeeHandler.execute.mock.calls[0][0] as GetEmployeeQuery;
      expect(query.employeeId).toBe('emp-123');
    });

    it('should propagate EmployeeNotFoundError from the handler', async () => {
      mockGetEmployeeHandler.execute.mockRejectedValue(
        new EmployeeNotFoundError('non-existent'),
      );

      await expect(controller.getById('non-existent')).rejects.toThrow(
        EmployeeNotFoundError,
      );
    });
  });

  // ─── GET /employees ────────────────────────────────────────────

  describe('GET /employees', () => {
    it('should call ListEmployeesHandler with companyId and return EmployeeResponseDto[]', async () => {
      const emp1 = buildEmployee('emp-1', {
        email: 'alice@example.com',
        name: 'Alice',
        position: 'Engineer',
        salaryAmount: 500000,
        department: 'Engineering',
        companyId: 'company-1',
      });
      const emp2 = buildEmployee('emp-2', {
        email: 'bob@example.com',
        name: 'Bob',
        position: 'Designer',
        salaryAmount: 600000,
        department: 'Design',
        companyId: 'company-1',
      });
      mockListEmployeesHandler.execute.mockResolvedValue([emp1, emp2]);

      const result = await controller.list('company-1');

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(EmployeeResponseDto);
      expect(result[0].id).toBe('emp-1');
      expect(result[0].email).toBe('alice@example.com');
      expect(result[1].id).toBe('emp-2');
      expect(result[1].email).toBe('bob@example.com');
      expect(mockListEmployeesHandler.execute).toHaveBeenCalledWith(
        expect.any(ListEmployeesQuery),
      );

      const query = mockListEmployeesHandler.execute.mock.calls[0][0] as ListEmployeesQuery;
      expect(query.companyId).toBe('company-1');
    });

    it('should return an empty array when no employees exist', async () => {
      mockListEmployeesHandler.execute.mockResolvedValue([]);

      const result = await controller.list('empty-company');

      expect(result).toEqual([]);
    });
  });
});
