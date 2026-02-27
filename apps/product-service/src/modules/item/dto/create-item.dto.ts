import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { DESCRIPTION_MAX_LENGTH, NAME_MAX_LENGTH } from '@/common/constants/product.constants';

export class CreateItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(NAME_MAX_LENGTH)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(DESCRIPTION_MAX_LENGTH)
  description?: string;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  weight?: number;

  @IsUUID()
  @IsOptional()
  categoryId?: string;
}
