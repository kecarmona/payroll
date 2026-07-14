import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO representing a payroll period's full data.
 *
 * Used as the return type for GET periods endpoints.
 */
export class PayrollPeriodResponseDto {
  @ApiProperty({
    description: 'Payroll period unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({
    description: 'Company / tenant identifier',
    example: 'company-123',
  })
  companyId!: string;

  @ApiProperty({
    description: 'Month (1–12)',
    example: 3,
  })
  month!: number;

  @ApiProperty({
    description: 'Year',
    example: 2026,
  })
  year!: number;

  @ApiProperty({
    description: 'Period start date (ISO 8601)',
    example: '2026-03-01',
  })
  startDate!: string;

  @ApiProperty({
    description: 'Period end date (ISO 8601)',
    example: '2026-03-31',
  })
  endDate!: string;

  @ApiProperty({
    description: 'Whether the period is closed for modifications',
    example: false,
  })
  isClosed!: boolean;
}
