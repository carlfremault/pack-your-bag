import { ApiProperty } from '@nestjs/swagger';

import { Expose } from 'class-transformer';

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT Access token' })
  @Expose()
  readonly access_token: string;

  @ApiProperty({ description: 'JWT Refresh token' })
  @Expose()
  readonly refresh_token: string;

  @ApiProperty({ description: 'Token type', example: 'Bearer' })
  @Expose()
  readonly token_type: string = 'Bearer';

  @ApiProperty({ description: 'Access token expiration time in seconds' })
  @Expose()
  readonly expires_in: number;

  @ApiProperty({
    description: 'User information',
    type: 'object',
    properties: {
      id: { type: 'string', description: 'User ID' },
      role: { type: 'number', description: 'User role' },
      isGuest: { type: 'boolean', description: 'User has guest status' },
    },
  })
  @Expose()
  readonly user: { id: string; role: number; isGuest: boolean };
}
