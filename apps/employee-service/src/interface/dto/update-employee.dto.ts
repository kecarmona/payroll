import { IsOptional, IsString, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for updating an existing employee's personal data.
 *
 * All fields are optional — only provided fields are updated.
 * The employee must exist and must not be terminated.
 */
export class UpdateEmployeeDto {
  @ApiPropertyOptional({
    description: 'Employee full name',
    example: 'Jane Doe Updated',
    minLength: 2,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({
    description: 'Employee job position / title',
    example: 'Lead Engineer',
    minLength: 2,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  position?: string;

  @ApiPropertyOptional({
    description: 'Employee department',
    example: 'Product',
    minLength: 2,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  department?: string;
}
