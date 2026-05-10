import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MAX_LENGTH_MESSAGE,
  PASSWORD_MESSAGE,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MIN_LENGTH_MESSAGE,
  PASSWORD_REGEX,
} from '@/common/constants/auth.constants';

export class UpdatePasswordDto {
  @ApiProperty({ example: 'v4l1dPassw0rd', minLength: 1 })
  @IsNotEmpty()
  @IsString()
  readonly currentPassword: string;

  @ApiProperty({
    example: '4n0th3rP4ssw0rd',
    pattern: PASSWORD_REGEX.source,
    maxLength: PASSWORD_MAX_LENGTH,
    minLength: PASSWORD_MIN_LENGTH,
  })
  @IsNotEmpty()
  @IsString()
  @Matches(PASSWORD_REGEX, {
    message: PASSWORD_MESSAGE,
  })
  @MinLength(PASSWORD_MIN_LENGTH, { message: PASSWORD_MIN_LENGTH_MESSAGE })
  @MaxLength(PASSWORD_MAX_LENGTH, { message: PASSWORD_MAX_LENGTH_MESSAGE })
  readonly newPassword: string;
}
