import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

import {
  LOCALE_MESSAGE,
  LOCALE_REGEX,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MAX_LENGTH_MESSAGE,
  PASSWORD_MESSAGE,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MIN_LENGTH_MESSAGE,
  PASSWORD_REGEX,
} from '@/common/constants/auth.constants';

export class AuthResetPasswordDto {
  @ApiProperty({ example: '4e1a9b2c8f3d5e7a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a' })
  @IsNotEmpty()
  @IsString()
  readonly token: string;

  @ApiProperty({ example: 'v4l1dPassw0rd', pattern: PASSWORD_REGEX.source })
  @IsNotEmpty()
  @IsString()
  @Matches(PASSWORD_REGEX, {
    message: PASSWORD_MESSAGE,
  })
  @MinLength(PASSWORD_MIN_LENGTH, { message: PASSWORD_MIN_LENGTH_MESSAGE })
  @MaxLength(PASSWORD_MAX_LENGTH, { message: PASSWORD_MAX_LENGTH_MESSAGE })
  readonly password: string;

  @ApiProperty({
    example: 'fr-FR',
    description: 'User locale, to enable date localization in email templates',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  @Matches(LOCALE_REGEX, { message: LOCALE_MESSAGE })
  readonly locale?: string;
}
