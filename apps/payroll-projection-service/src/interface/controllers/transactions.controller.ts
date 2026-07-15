import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@payroll/auth-guards';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PayrollTransactionProjection } from '../../infrastructure/mongoose/payroll-transaction.schema';

/**
 * REST controller for payroll transaction projection queries.
 *
 * Provides read-only endpoints to retrieve denormalized per-employee
 * transaction data from the MongoDB projection store.
 *
 * ## Security
 * All endpoints require JWT authentication via Bearer token.
 */
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
@UseGuards(JwtAuthGuard)
@ApiTags('Projections - Transactions')
@Controller('api/projections/transactions')
export class TransactionsController {
  constructor(
    @InjectModel(PayrollTransactionProjection.name)
    private readonly transactionModel: Model<PayrollTransactionProjection>,
  ) {}

  /**
   * Lists transactions for a given payroll job.
   *
   * @param jobId - The payroll job identifier (required query param).
   * @returns An array of transaction projections, sorted by most recent update.
   */
  @Get()
  @ApiOperation({ summary: 'List transactions for a payroll job' })
  @ApiQuery({ name: 'jobId', required: true, description: 'Payroll job ID' })
  async findByJob(
    @Query('jobId') jobId: string,
  ): Promise<PayrollTransactionProjection[]> {
    return this.transactionModel
      .find({ jobId })
      .sort({ updatedAt: -1 })
      .exec();
  }
}
