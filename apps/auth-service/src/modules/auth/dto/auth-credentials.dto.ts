import { ApiProperty } from '@nestjs/swagger';

import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MAX_LENGTH_MESSAGE,
  PASSWORD_MESSAGE,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MIN_LENGTH_MESSAGE,
  PASSWORD_REGEX,
} from '@/common/constants/auth.constants';

export class AuthCredentialsDto {
  @ApiProperty({ example: 'john.doe@example.com', format: 'email' })
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  readonly email: string;

  @ApiProperty({ example: 'v4l1dPassw0rd', pattern: PASSWORD_REGEX.source })
  @IsNotEmpty()
  @IsString()
  @Matches(PASSWORD_REGEX, {
    message: PASSWORD_MESSAGE,
  })
  @MinLength(PASSWORD_MIN_LENGTH, { message: PASSWORD_MIN_LENGTH_MESSAGE })
  @MaxLength(PASSWORD_MAX_LENGTH, { message: PASSWORD_MAX_LENGTH_MESSAGE })
  readonly password: string;
}
