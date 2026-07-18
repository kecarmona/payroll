import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO representing a payroll job's full data.
 *
 * Used as the return type for GET job endpoints.
 */
export class PayrollJobResponseDto {
  @ApiProperty({
    description: 'Payroll job unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({
    description: 'Company / tenant identifier',
    example: 'company-123',
  })
  companyId!: string;

  @ApiProperty({
    description: 'Target payroll period ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  periodId!: string;

  @ApiProperty({
    description: 'Current job status',
    example: 'CREATED',
    enum: ['CREATED', 'PROCESSING', 'COMPLETED', 'FAILED'],
  })
  status!: string;
}
