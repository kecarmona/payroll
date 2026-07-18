import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for login (authentication) requests.
 *
 * Validates that the email is well-formed and the password is a
 * non-empty string.
 */
export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@company.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Account password',
    example: 'securePassword123',
  })
  @IsString()
  @MinLength(1)
  password!: string;
}
