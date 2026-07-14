import { IsEmail, IsEnum, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../domain/user-role';

/**
 * DTO for user registration requests.
 *
 * Validates that the email is well-formed, the password meets minimum
 * length requirements, and the role is a valid UserRole enum value.
 */
export class RegisterUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@company.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Account password (minimum 8 characters)',
    example: 'securePassword123',
    minLength: 8,
  })
  @MinLength(8)
  password!: string;

  @ApiProperty({
    description: 'User role for authorization',
    enum: UserRole,
    example: UserRole.EMPLOYEE,
  })
  @IsEnum(UserRole)
  role!: UserRole;
}
