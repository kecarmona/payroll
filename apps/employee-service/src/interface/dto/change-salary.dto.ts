import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for changing an employee's salary.
 *
 * Both the new salary amount (in the smallest currency unit) and the
 * ISO 4217 currency code are required.
 */
export class ChangeSalaryDto {
  @ApiProperty({
    description: 'New annual salary amount in the smallest currency unit (e.g. cents)',
    example: 750000,
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
}
