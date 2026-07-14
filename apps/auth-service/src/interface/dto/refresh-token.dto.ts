import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for refresh token rotation requests.
 *
 * Validates that the refresh token is a valid UUID v4 string.
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token (UUID v4) issued at login or previous refresh',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsUUID()
  refreshToken!: string;
}
