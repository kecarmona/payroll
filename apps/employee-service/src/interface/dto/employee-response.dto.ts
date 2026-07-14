import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO representing an employee's full data.
 *
 * Used as the return type for GET /employees/:id and
 * the elements in GET /employees responses.
 */
export class EmployeeResponseDto {
  @ApiProperty({
    description: 'Unique employee identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({
    description: 'Employee email address',
    example: 'employee@company.com',
  })
  email!: string;

  @ApiProperty({
    description: 'Employee full name',
    example: 'John Doe',
  })
  name!: string;

  @ApiProperty({
    description: 'Employee job position / title',
    example: 'Senior Engineer',
  })
  position!: string;

  @ApiProperty({
    description: 'Annual salary amount in the smallest currency unit (e.g. cents)',
    example: 500000,
  })
  salaryAmount!: number;

  @ApiProperty({
    description: 'ISO 4217 currency code',
    example: 'USD',
  })
  salaryCurrency!: string;

  @ApiProperty({
    description: 'Employee department',
    example: 'Engineering',
  })
  department!: string;

  @ApiProperty({
    description: 'Current employment status',
    example: 'ACTIVE',
  })
  status!: string;

  @ApiProperty({
    description: 'Whether the employee is actively employed',
    example: true,
  })
  isActive!: boolean;
}
