import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles } from '@payroll/auth-guards';
import { CreateEmployeeHandler, CreateEmployeeCommand } from '../application/create-employee.command';
import { UpdateEmployeeHandler, UpdateEmployeeCommand } from '../application/update-employee.command';
import { ChangeSalaryHandler, ChangeSalaryCommand } from '../application/change-salary.command';
import { TerminateEmployeeHandler, TerminateEmployeeCommand } from '../application/terminate-employee.command';
import { GetEmployeeHandler, GetEmployeeQuery } from '../application/queries/get-employee.query';
import { ListEmployeesHandler, ListEmployeesQuery } from '../application/queries/list-employees.query';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { ChangeSalaryDto } from './dto/change-salary.dto';
import { EmployeeResponseDto } from './dto/employee-response.dto';

/**
 * Employee management controller.
 *
 * Handles CRUD operations for employees including creation, data updates,
 * salary changes, termination, and retrieval.
 *
 * All endpoints are grouped under `/employees` and documented
 * with OpenAPI/Swagger decorators for API exploration.
 *
 * ## Security
 * All endpoints require JWT authentication via Bearer token.
 * Write operations (POST, PATCH) require HR or ADMIN role.
 * Read operations (GET) are accessible to authenticated EMPLOYEE, HR, and ADMIN roles.
 */
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
@ApiForbiddenResponse({ description: 'Insufficient role permissions' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Employees')
@Controller('employees')
export class EmployeeController {
  constructor(
    private readonly createEmployeeHandler: CreateEmployeeHandler,
    private readonly updateEmployeeHandler: UpdateEmployeeHandler,
    private readonly changeSalaryHandler: ChangeSalaryHandler,
    private readonly terminateEmployeeHandler: TerminateEmployeeHandler,
    private readonly getEmployeeHandler: GetEmployeeHandler,
    private readonly listEmployeesHandler: ListEmployeesHandler,
  ) {}

  /**
   * Register a new employee.
   *
   * Creates an employee with the given email, name, position, salary,
   * department, and company. Returns the new employee's unique identifier.
   */
  @Post()
  @Roles('HR', 'ADMIN')
  @ApiOperation({
    summary: 'Register a new employee',
    description:
      'Creates a new employee with email, name, position, salary, ' +
      'department, and company assignment.',
  })
  @ApiBody({ type: CreateEmployeeDto })
  @ApiCreatedResponse({
    description: 'Employee created successfully',
    schema: {
      type: 'object',
      properties: { employeeId: { type: 'string', example: 'employeeId-uuid' } },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation error (invalid email, missing fields, duplicate email)',
  })
  async create(
    @Body() dto: CreateEmployeeDto,
  ): Promise<{ employeeId: string }> {
    const command = new CreateEmployeeCommand(
      dto.email,
      dto.name,
      dto.position,
      dto.salaryAmount,
      dto.salaryCurrency,
      dto.department,
      dto.companyId,
    );
    const employeeId = await this.createEmployeeHandler.execute(command);
    return { employeeId };
  }

  /**
   * Update an employee's personal data.
   *
   * Allows changing name, position, and department. All fields are
   * optional — only provided fields are updated.
   */
  @Patch(':id')
  @Roles('HR', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update employee personal data',
    description:
      'Updates the employee name, position, and/or department. ' +
      'All fields are optional. The employee must exist and must not be terminated.',
  })
  @ApiParam({ name: 'id', description: 'Employee unique identifier' })
  @ApiBody({ type: UpdateEmployeeDto })
  @ApiOkResponse({ description: 'Employee updated successfully' })
  @ApiBadRequestResponse({ description: 'Validation error' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
  ): Promise<void> {
    const command = new UpdateEmployeeCommand(
      id,
      dto.name ?? '',
      dto.position ?? '',
      dto.department ?? '',
    );
    await this.updateEmployeeHandler.execute(command);
  }

  /**
   * Change an employee's salary.
   *
   * Updates the salary amount and currency. The employee must exist
   * and must not be terminated.
   */
  @Patch(':id/salary')
  @Roles('HR', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change employee salary',
    description:
      'Changes the employee salary amount and/or currency. ' +
      'The employee must exist and must not be terminated.',
  })
  @ApiParam({ name: 'id', description: 'Employee unique identifier' })
  @ApiBody({ type: ChangeSalaryDto })
  @ApiOkResponse({ description: 'Salary changed successfully' })
  @ApiBadRequestResponse({ description: 'Validation error' })
  async changeSalary(
    @Param('id') id: string,
    @Body() dto: ChangeSalaryDto,
  ): Promise<void> {
    const command = new ChangeSalaryCommand(id, dto.salaryAmount, dto.salaryCurrency);
    await this.changeSalaryHandler.execute(command);
  }

  /**
   * Terminate an employee's employment.
   *
   * Marks the employee as terminated. Idempotent — terminating an
   * already-terminated employee is a no-op.
   */
  @Post(':id/terminate')
  @Roles('HR', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Terminate employee',
    description:
      'Marks the employee as terminated. Idempotent — terminating an ' +
      'already-terminated employee is a no-op.',
  })
  @ApiParam({ name: 'id', description: 'Employee unique identifier' })
  @ApiOkResponse({ description: 'Employee terminated successfully' })
  @ApiBadRequestResponse({ description: 'Employee not found' })
  async terminate(@Param('id') id: string): Promise<void> {
    const command = new TerminateEmployeeCommand(id);
    await this.terminateEmployeeHandler.execute(command);
  }

  /**
   * Get an employee by ID.
   *
   * Returns the full employee data for the given identifier.
   */
  @Get(':id')
  @Roles('EMPLOYEE', 'HR', 'ADMIN')
  @ApiOperation({
    summary: 'Get employee by ID',
    description: 'Returns the full employee data for the given unique identifier.',
  })
  @ApiParam({ name: 'id', description: 'Employee unique identifier' })
  @ApiOkResponse({
    description: 'Employee data',
    type: EmployeeResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Employee not found' })
  async getById(@Param('id') id: string): Promise<EmployeeResponseDto> {
    const query = new GetEmployeeQuery(id);
    const employee = await this.getEmployeeHandler.execute(query);

    const dto = new EmployeeResponseDto();
    dto.id = employee.id;
    dto.email = employee.email;
    dto.name = employee.name;
    dto.position = employee.position;
    dto.salaryAmount = employee.salary.amount;
    dto.salaryCurrency = employee.salary.currency;
    dto.department = employee.department;
    dto.status = employee.status.value;
    dto.isActive = employee.isActive;
    return dto;
  }

  /**
   * List employees by company.
   *
   * Returns all employees belonging to the specified company.
   */
  @Get()
  @Roles('EMPLOYEE', 'HR', 'ADMIN')
  @ApiOperation({
    summary: 'List employees by company',
    description: 'Returns all employees belonging to the specified company.',
  })
  @ApiQuery({
    name: 'companyId',
    description: 'Company / tenant identifier',
    required: true,
  })
  @ApiOkResponse({
    description: 'List of employees',
    type: [EmployeeResponseDto],
  })
  async list(@Query('companyId') companyId: string): Promise<EmployeeResponseDto[]> {
    const query = new ListEmployeesQuery(companyId);
    const employees = await this.listEmployeesHandler.execute(query);

    return employees.map((employee) => {
      const dto = new EmployeeResponseDto();
      dto.id = employee.id;
      dto.email = employee.email;
      dto.name = employee.name;
      dto.position = employee.position;
      dto.salaryAmount = employee.salary.amount;
      dto.salaryCurrency = employee.salary.currency;
      dto.department = employee.department;
      dto.status = employee.status.value;
      dto.isActive = employee.isActive;
      return dto;
    });
  }
}
