import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for creating a new payroll job.
 *
 * The idempotency key is required to ensure safe retry of the
 * request without duplicate processing.
 */
export class CreatePayrollJobDto {
  @ApiProperty({
    description: 'Company / tenant identifier',
    example: 'company-123',
  })
  @IsString()
  @MinLength(1)
  companyId!: string;

  @ApiProperty({
    description: 'Target payroll period ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @MinLength(1)
  periodId!: string;
}
