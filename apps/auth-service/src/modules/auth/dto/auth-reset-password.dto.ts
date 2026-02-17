import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

import {
  LOCALE_REGEX,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MAX_LENGTH_MESSAGE,
  PASSWORD_MESSAGE,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MIN_LENGTH_MESSAGE,
  PASSWORD_REGEX,
} from '@/common/constants/auth.constants';

export class AuthResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  readonly token: string;

  @IsNotEmpty()
  @IsString()
  @Matches(PASSWORD_REGEX, {
    message: PASSWORD_MESSAGE,
  })
  @MinLength(PASSWORD_MIN_LENGTH, { message: PASSWORD_MIN_LENGTH_MESSAGE })
  @MaxLength(PASSWORD_MAX_LENGTH, { message: PASSWORD_MAX_LENGTH_MESSAGE })
  readonly password: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  @Matches(LOCALE_REGEX, { message: 'Locale must be a valid format (e.g., en, en-GB)' })
  readonly locale?: string;
}
