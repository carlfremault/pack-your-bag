import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

import {
  COLOR_CODE_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  NAME_MAX_LENGTH,
} from '@/common/constants/product.constants';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Category name', example: 'Category name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(NAME_MAX_LENGTH)
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

  @ApiProperty({ description: 'Category color code', example: '#000000', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(COLOR_CODE_MAX_LENGTH)
  colorCode?: string;
}
