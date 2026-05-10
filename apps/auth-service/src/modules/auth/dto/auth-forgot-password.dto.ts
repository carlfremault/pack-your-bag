import { ApiProperty } from '@nestjs/swagger';

import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

import { EMAIL_MAX_LENGTH } from '@/common/constants/auth.constants';

export class AuthForgotPasswordDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    format: 'email',
    maxLength: EMAIL_MAX_LENGTH,
    minLength: 1,
  })
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  @MaxLength(EMAIL_MAX_LENGTH)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  readonly email: string;
}
