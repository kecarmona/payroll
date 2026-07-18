import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@payroll/auth-guards';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PayrollJobProjection } from '../../infrastructure/mongoose/payroll-job.schema';

/**
 * REST controller for payroll job projection queries.
 *
 * Provides read-only endpoints to retrieve denormalized payroll job data
 * from the MongoDB projection store. All endpoints filter by `companyId`
 * for multi-tenancy.
 *
 * ## Security
 * All endpoints require JWT authentication via Bearer token.
 */
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
@UseGuards(JwtAuthGuard)
@ApiTags('Projections - Jobs')
@Controller('api/projections/jobs')
export class JobsController {
  constructor(
    @InjectModel(PayrollJobProjection.name)
    private readonly jobModel: Model<PayrollJobProjection>,
  ) {}

  /**
   * Lists payroll jobs for a given company, sorted by most recent update.
   *
   * @param companyId - The tenant company identifier (required query param).
   * @returns An array of payroll job projections.
   */
  @Get()
  @ApiOperation({ summary: 'List payroll jobs for a company' })
  @ApiQuery({ name: 'companyId', required: true, description: 'Tenant company ID' })
  async findAll(@Query('companyId') companyId: string): Promise<PayrollJobProjection[]> {
    return this.jobModel
      .find({ companyId })
      .sort({ updatedAt: -1 })
      .exec();
  }

  /**
   * Gets a single payroll job with its transaction summary.
   *
   * @param jobId - The payroll job identifier.
   * @param companyId - The tenant company identifier (required query param).
   * @returns The payroll job projection, or `null` if not found.
   */
  @Get(':jobId')
  @ApiOperation({ summary: 'Get a single payroll job' })
  @ApiQuery({ name: 'companyId', required: true, description: 'Tenant company ID' })
  async findOne(
    @Param('jobId') jobId: string,
    @Query('companyId') companyId: string,
  ): Promise<PayrollJobProjection | null> {
    return this.jobModel.findOne({ jobId, companyId }).exec();
  }
}
