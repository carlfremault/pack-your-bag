import { ApiProperty } from '@nestjs/swagger';

import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import { NAME_MAX_LENGTH } from '@/common/constants/product.constants';
import { CreateCategoryDto } from '@/modules/category/dto/create-category.dto';

export class AssistantPackItemDto {
  @ApiProperty({
    description: 'Item name',
    example: 'Passport',
    maxLength: NAME_MAX_LENGTH,
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(NAME_MAX_LENGTH)
  name: string;

  @ApiProperty({ description: 'Item quantity', example: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Item note', example: 'Check expiry date', required: false })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiProperty({ type: CreateCategoryDto, description: 'Item category' })
  @ValidateNested()
  @Type(() => CreateCategoryDto)
  category: CreateCategoryDto;
}

export class CreateAssistantPackDto {
  @ApiProperty({
    description: 'Pack name',
    example: 'Weekend trip to Rome',
    maxLength: NAME_MAX_LENGTH,
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(NAME_MAX_LENGTH)
  packName: string;

  @ApiProperty({ type: [AssistantPackItemDto], description: 'Generated packing items' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssistantPackItemDto)
  items: AssistantPackItemDto[];
}
