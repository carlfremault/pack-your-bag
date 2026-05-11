import { ApiProperty } from '@nestjs/swagger';

import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

import {
  CATEGORY_NAME_MAX_LENGTH,
  COLOR_CODE_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
} from '@/common/constants/product.constants';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Category name',
    example: 'Category name',
    maxLength: CATEGORY_NAME_MAX_LENGTH,
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(CATEGORY_NAME_MAX_LENGTH)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  name: string;

  @ApiProperty({
    description: 'Category description',
    example: 'Category description',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(DESCRIPTION_MAX_LENGTH)
  description?: string;

  @ApiProperty({ description: 'Category color theme', example: 'slate' })
  @IsString()
  @MaxLength(COLOR_CODE_MAX_LENGTH)
  colorTheme: string;
}
