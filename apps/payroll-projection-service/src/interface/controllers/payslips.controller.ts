import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PayslipProjection } from '../../infrastructure/mongoose/payslip.schema';

/**
 * REST controller for payslip projection queries.
 *
 * Provides read-only endpoints to search and retrieve denormalized
 * payslip data from the MongoDB projection store.
 */
@ApiTags('Projections - Payslips')
@Controller('api/projections/payslips')
export class PayslipsController {
  constructor(
    @InjectModel(PayslipProjection.name)
    private readonly payslipModel: Model<PayslipProjection>,
  ) {}

  /**
   * Searches payslips by employee identifier.
   *
   * @param employeeId - The employee identifier (required query param).
   * @returns An array of payslip projections, sorted by generation date (newest first).
   */
  @Get()
  @ApiOperation({ summary: 'Search payslips by employee' })
  @ApiQuery({ name: 'employeeId', required: true, description: 'Employee ID' })
  async searchByEmployee(
    @Query('employeeId') employeeId: string,
  ): Promise<PayslipProjection[]> {
    return this.payslipModel
      .find({ employeeId })
      .sort({ generatedAt: -1 })
      .exec();
  }

  /**
   * Gets a single payslip by its identifier.
   *
   * @param payslipId - The payslip identifier.
   * @returns The payslip projection, or `null` if not found.
   */
  @Get(':payslipId')
  @ApiOperation({ summary: 'Get a single payslip' })
  async findOne(@Param('payslipId') payslipId: string): Promise<PayslipProjection | null> {
    return this.payslipModel.findOne({ payslipId }).exec();
  }
}
