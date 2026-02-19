import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

import { LOCALE_MESSAGE, LOCALE_REGEX } from '@/common/constants/auth.constants';

export class DeleteUserDto {
  @ApiProperty({ example: 'v4l1dPassw0rd' })
  @IsNotEmpty()
  @IsString()
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
