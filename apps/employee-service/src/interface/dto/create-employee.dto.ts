import { IsEmail, IsNotEmpty, IsNumber, IsPositive, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for creating a new employee.
 *
 * Validates that all required registration fields are present and
 * well-formed: email, name, position, salary details, department,
 * and the tenant/company identifier.
 */
export class CreateEmployeeDto {
  @ApiProperty({
    description: 'Employee email address',
    example: 'employee@company.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Employee full name',
    example: 'John Doe',
    minLength: 2,
  })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({
    description: 'Employee job position / title',
    example: 'Senior Engineer',
    minLength: 2,
  })
  @IsString()
  @MinLength(2)
  position!: string;

  @ApiProperty({
    description: 'Annual salary amount in the smallest currency unit (e.g. cents)',
    example: 500000,
  })
  @IsNumber()
  @IsPositive()
  salaryAmount!: number;

  @ApiProperty({
    description: 'ISO 4217 currency code',
    example: 'USD',
  })
  @IsString()
  @IsNotEmpty()
  salaryCurrency!: string;

  @ApiProperty({
    description: 'Employee department',
    example: 'Engineering',
    minLength: 2,
  })
  @IsString()
  @MinLength(2)
  department!: string;

  @ApiProperty({
    description: 'Company / tenant identifier',
    example: 'company-123',
  })
  @IsString()
  @IsNotEmpty()
  companyId!: string;
}
