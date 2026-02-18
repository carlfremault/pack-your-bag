import { ApiProperty } from '@nestjs/swagger';

import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class AuthForgotPasswordDto {
  @ApiProperty({ example: 'john.doe@example.com', format: 'email' })
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  readonly email: string;
}
