import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

import { NAME_MAX_LENGTH } from '@/common/constants/product.constants';

export class ClonePackDto {
  @ApiProperty({
    description: 'Pack name',
    example: 'Pack name',
    maxLength: NAME_MAX_LENGTH,
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(NAME_MAX_LENGTH)
  newName: string;
}
