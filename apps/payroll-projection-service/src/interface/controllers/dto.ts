import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Base projection response DTO.
 * Contains the common metadata fields shared by all projection responses.
 */
export class ProjectionResponseDto {
  /** Unique identifier of the projected entity. */
  id!: string;

  /** Tenant (company) identifier. */
  companyId!: string;

  /** ISO timestamp of the last update. */
  updatedAt!: string;
}

/**
 * Payroll job projection response DTO.
 */
export class PayrollJobResponseDto {
  @ApiPropertyOptional({ description: 'Payroll job ID' })
  jobId?: string;

  @ApiPropertyOptional({ description: 'Tenant company ID' })
  companyId?: string;

  @ApiPropertyOptional({ description: 'Payroll period ID' })
  periodId?: string;

  @ApiPropertyOptional({ description: 'Current job status' })
  status?: string;

  @ApiPropertyOptional({ description: 'Total eligible employees' })
  totalEmployees?: number;

  @ApiPropertyOptional({ description: 'Successfully processed transactions' })
  processedCount?: number;

  @ApiPropertyOptional({ description: 'Failed transactions' })
  failedCount?: number;
}

/**
 * Transaction projection response DTO.
 */
export class TransactionResponseDto {
  @ApiPropertyOptional({ description: 'Transaction ID' })
  transactionId?: string;

  @ApiPropertyOptional({ description: 'Parent job ID' })
  jobId?: string;

  @ApiPropertyOptional({ description: 'Employee ID' })
  employeeId?: string;

  @ApiPropertyOptional({ description: 'Current transaction status' })
  status?: string;

  @ApiPropertyOptional({ description: 'Gross pay amount' })
  grossPay?: number;

  @ApiPropertyOptional({ description: 'Deductions amount' })
  deductions?: number;

  @ApiPropertyOptional({ description: 'Net pay amount' })
  netPay?: number;
}

/**
 * Payslip projection response DTO.
 */
export class PayslipResponseDto {
  @ApiPropertyOptional({ description: 'Payslip ID' })
  payslipId?: string;

  @ApiPropertyOptional({ description: 'Employee ID' })
  employeeId?: string;

  @ApiPropertyOptional({ description: 'Gross pay amount' })
  grossPay?: number;

  @ApiPropertyOptional({ description: 'Deductions amount' })
  deductions?: number;

  @ApiPropertyOptional({ description: 'Net pay amount' })
  netPay?: number;
}
