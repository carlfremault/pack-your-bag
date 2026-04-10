import { ApiProperty } from '@nestjs/swagger';

import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

import { EMAIL_MAX_LENGTH } from '@/common/constants/auth.constants';

export class AuthResendVerificationEmailDto {
  @ApiProperty({ example: 'john.doe@example.com', format: 'email' })
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  @MaxLength(EMAIL_MAX_LENGTH)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  readonly email: string;
}
