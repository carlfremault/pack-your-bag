import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

import {
  COLOR_CODE_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  NAME_MAX_LENGTH,
} from '@/common/constants/product.constants';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(NAME_MAX_LENGTH)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(DESCRIPTION_MAX_LENGTH)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(COLOR_CODE_MAX_LENGTH)
  colorCode?: string;
}
