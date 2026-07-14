import { IsInt, IsString, Min, Max, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for creating a new payroll period.
 *
 * Validates that the period belongs to a valid company, covers a specific
 * month (1–12) and year (2020–2050), and has valid ISO date strings
 * for the start and end dates.
 */
export class CreatePayrollPeriodDto {
  @ApiProperty({
    description: 'Company / tenant identifier',
    example: 'company-123',
  })
  @IsString()
  @MinLength(1)
  companyId!: string;

  @ApiProperty({
    description: 'Month (1–12)',
    example: 3,
    minimum: 1,
    maximum: 12,
  })
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @ApiProperty({
    description: 'Year (2020–2050)',
    example: 2026,
    minimum: 2020,
    maximum: 2050,
  })
  @IsInt()
  @Min(2020)
  @Max(2050)
  year!: number;

  @ApiProperty({
    description: 'Period start date (ISO 8601)',
    example: '2026-03-01',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'startDate must be in YYYY-MM-DD format',
  })
  startDate!: string;

  @ApiProperty({
    description: 'Period end date (ISO 8601)',
    example: '2026-03-31',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'endDate must be in YYYY-MM-DD format',
  })
  endDate!: string;
}
