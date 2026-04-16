import { ApiProperty } from '@nestjs/swagger';

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
  @ApiProperty({
    description: 'Item name',
    example: 'Item name',
    maxLength: NAME_MAX_LENGTH,
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(NAME_MAX_LENGTH)
  name: string;

  @ApiProperty({
    description: 'Item description',
    example: 'Item description',
    required: false,
    maxLength: DESCRIPTION_MAX_LENGTH,
  })
  @IsString()
  @IsOptional()
  @MaxLength(DESCRIPTION_MAX_LENGTH)
  description?: string;

  @ApiProperty({
    description: 'Item weight',
    example: 100,
    required: false,
    minimum: 0,
    exclusiveMinimum: true,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  weight?: number;

  @ApiProperty({
    description: 'Item category uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  categoryId?: string;
}
