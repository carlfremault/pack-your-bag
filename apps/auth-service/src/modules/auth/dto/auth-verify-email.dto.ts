import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsString } from 'class-validator';

export class AuthVerifyEmailDto {
  @ApiProperty({
    example: '4e1a9b2c8f3d5e7a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a',
    minLength: 1,
  })
  @IsNotEmpty()
  @IsString()
  readonly token: string;
}
