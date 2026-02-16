import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

import { LOCALE_REGEX } from '@/common/constants/auth.constants';

export class DeleteUserDto {
  @IsNotEmpty()
  @IsString()
  readonly password: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  @Matches(LOCALE_REGEX, { message: 'Locale must be a valid format (e.g., en, en-GB)' })
  readonly locale?: string;
}
