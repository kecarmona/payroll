import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles } from '@payroll/auth-guards';
import { CreatePayrollPeriodHandler, CreatePayrollPeriodCommand } from '../application/create-payroll-period.command';
import { CreatePayrollJobHandler, CreatePayrollJobCommand } from '../application/create-payroll-job.command';
import { GetPayrollJobHandler, GetPayrollJobQuery } from '../application/queries/get-payroll-job.query';
import { ListPayrollPeriodsHandler, ListPayrollPeriodsQuery } from '../application/queries/list-payroll-periods.query';
import { CreatePayrollPeriodDto } from './dto/create-payroll-period.dto';
import { CreatePayrollJobDto } from './dto/create-payroll-job.dto';
import { PayrollPeriodResponseDto } from './dto/payroll-period-response.dto';
import { PayrollJobResponseDto } from './dto/payroll-job-response.dto';
import { IdempotencyGuard } from './guards/idempotency.guard';

/**
 * Payroll management controller.
 *
 * Handles payroll period and job orchestration including creation,
 * retrieval, and listing of periods and jobs.
 *
 * All endpoints are grouped under `/payroll` and documented
 * with OpenAPI/Swagger decorators for API exploration.
 *
 * ## Security
 * All endpoints require JWT authentication via Bearer token.
 * Write operations (POST) require HR or ADMIN role.
 * Read operations (GET) require at least EMPLOYEE role.
 */
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
@ApiForbiddenResponse({ description: 'Insufficient role permissions' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Payroll')
@Controller('payroll')
export class PayrollController {
  constructor(
    private readonly createPayrollPeriodHandler: CreatePayrollPeriodHandler,
    private readonly createPayrollJobHandler: CreatePayrollJobHandler,
    private readonly getPayrollJobHandler: GetPayrollJobHandler,
    private readonly listPayrollPeriodsHandler: ListPayrollPeriodsHandler,
  ) {}

  /**
   * Create a new payroll period.
   *
   * Creates a payroll period for the given company, month, and year.
   * Returns the new period's unique identifier.
   */
  @Post('periods')
  @Roles('HR', 'ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new payroll period',
    description:
      'Creates a payroll period for the specified company, month, and year. ' +
      'Returns the new period ID. Duplicate (companyId, month, year) periods are rejected.',
  })
  @ApiBody({ type: CreatePayrollPeriodDto })
  @ApiCreatedResponse({
    description: 'Payroll period created successfully',
    schema: {
      type: 'object',
      properties: { periodId: { type: 'string', example: 'periodId-uuid' } },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation error or duplicate period',
  })
  async createPeriod(
    @Body() dto: CreatePayrollPeriodDto,
  ): Promise<{ periodId: string }> {
    const command = new CreatePayrollPeriodCommand(
      dto.companyId,
      dto.month,
      dto.year,
      dto.startDate,
      dto.endDate,
    );
    const periodId = await this.createPayrollPeriodHandler.execute(command);
    return { periodId };
  }

  /**
   * Create a new payroll job.
   *
   * Creates a payroll job for the given company and period.
   * Idempotent — requires an `Idempotency-Key` header for safe retry.
   */
  @Post('jobs')
  @Roles('HR', 'ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(IdempotencyGuard)
  @ApiOperation({
    summary: 'Create a new payroll job',
    description:
      'Creates a payroll job for the specified company and payroll period. ' +
      'Requires an Idempotency-Key header for safe retry. ' +
      'The job is persisted atomically with its outbox event and idempotency record.',
  })
  @ApiHeader({
    name: 'Idempotency-Key',
    description: 'Unique key for idempotent request processing',
    required: true,
  })
  @ApiBody({ type: CreatePayrollJobDto })
  @ApiCreatedResponse({
    description: 'Payroll job created successfully',
    schema: {
      type: 'object',
      properties: {
        jobId: { type: 'string', example: 'jobId-uuid' },
        status: { type: 'string', example: 'CREATED' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @ApiConflictResponse({ description: 'Idempotency key reused with different request' })
  async createJob(
    @Body() dto: CreatePayrollJobDto,
    @Req() request: Request,
  ): Promise<{ jobId: string; status: string }> {
    const reqExt = request as unknown as Record<string, unknown>;
    const idempotencyInfo = reqExt.idempotencyInfo as
      | { key: string; requestHash: string }
      | undefined;
    const command = new CreatePayrollJobCommand(
      dto.companyId,
      dto.periodId,
      idempotencyInfo?.key ?? 'unknown',
      dto.employeeIds ?? [],
    );
    const result = await this.createPayrollJobHandler.execute(command);
    return result;
  }

  /**
   * Get a payroll job by ID.
   *
   * Returns the full job data for the given job identifier.
   */
  @Get('jobs/:id')
  @Roles('EMPLOYEE', 'HR', 'ADMIN')
  @ApiOperation({
    summary: 'Get payroll job by ID',
    description: 'Returns the full payroll job data for the given unique identifier.',
  })
  @ApiParam({ name: 'id', description: 'Payroll job unique identifier' })
  @ApiOkResponse({
    description: 'Payroll job data',
    type: PayrollJobResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Payroll job not found' })
  async getJob(@Param('id') id: string): Promise<PayrollJobResponseDto> {
    const query = new GetPayrollJobQuery(id);
    const job = await this.getPayrollJobHandler.execute(query);

    const dto = new PayrollJobResponseDto();
    dto.id = job.id;
    dto.companyId = job.companyId;
    dto.periodId = job.periodId;
    dto.status = job.status.value;
    return dto;
  }

  /**
   * Get a payroll job by company and period.
   *
   * Looks up a job using the company and period identifiers.
   */
  @Get('jobs')
  @Roles('EMPLOYEE', 'HR', 'ADMIN')
  @ApiOperation({
    summary: 'Get payroll job by company and period',
    description: 'Looks up a payroll job by company ID and period ID.',
  })
  @ApiQuery({ name: 'companyId', description: 'Company / tenant identifier', required: true })
  @ApiQuery({ name: 'periodId', description: 'Payroll period identifier', required: true })
  @ApiOkResponse({
    description: 'Payroll job data',
    type: PayrollJobResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Payroll job not found' })
  async getJobByCompanyAndPeriod(
    @Query('companyId') companyId: string,
    @Query('periodId') periodId: string,
  ): Promise<PayrollJobResponseDto> {
    const query = new GetPayrollJobQuery(periodId);
    const job = await this.getPayrollJobHandler.execute(query);

    const dto = new PayrollJobResponseDto();
    dto.id = job.id;
    dto.companyId = job.companyId;
    dto.periodId = job.periodId;
    dto.status = job.status.value;
    return dto;
  }

  /**
   * List payroll periods by company.
   *
   * Returns all payroll periods belonging to the specified company.
   */
  @Get('periods')
  @Roles('EMPLOYEE', 'HR', 'ADMIN')
  @ApiOperation({
    summary: 'List payroll periods by company',
    description: 'Returns all payroll periods belonging to the specified company.',
  })
  @ApiQuery({
    name: 'companyId',
    description: 'Company / tenant identifier',
    required: true,
  })
  @ApiOkResponse({
    description: 'List of payroll periods',
    type: [PayrollPeriodResponseDto],
  })
  async listPeriods(
    @Query('companyId') companyId: string,
  ): Promise<PayrollPeriodResponseDto[]> {
    const query = new ListPayrollPeriodsQuery(companyId);
    const periods = await this.listPayrollPeriodsHandler.execute(query);

    return periods.map((period) => {
      const dto = new PayrollPeriodResponseDto();
      dto.id = period.id;
      dto.companyId = period.companyId;
      dto.month = period.month;
      dto.year = period.year;
      dto.startDate = period.startDate;
      dto.endDate = period.endDate;
      dto.isClosed = period.isClosed;
      return dto;
    });
  }
}
