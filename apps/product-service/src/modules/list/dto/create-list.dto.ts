import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

import {
  COLOR_CODE_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  NAME_MAX_LENGTH,
} from '@/common/constants/product.constants';

export class CreateListDto {
  @ApiProperty({
    description: 'List name',
    example: 'List name',
    maxLength: NAME_MAX_LENGTH,
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(NAME_MAX_LENGTH)
  name: string;

  @ApiProperty({
    description: 'List description',
    example: 'List description',
    required: false,
    maxLength: DESCRIPTION_MAX_LENGTH,
  })
  @IsString()
  @IsOptional()
  @MaxLength(DESCRIPTION_MAX_LENGTH)
  description?: string;

  @ApiProperty({ description: 'List color theme', example: 'slate', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(COLOR_CODE_MAX_LENGTH)
  colorTheme?: string;
}
