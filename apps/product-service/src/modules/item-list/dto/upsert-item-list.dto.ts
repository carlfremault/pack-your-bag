import { ApiProperty } from '@nestjs/swagger';

import { IsInt, IsNotEmpty, IsNumber, IsPositive, IsUUID } from 'class-validator';
export class UpsertItemOnListDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'Item uuid', example: '123e4567-e89b-12d3-a456-426614174000' })
  itemId: string;

  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'List uuid', example: '123e4567-e89b-12d3-a456-426614174000' })
  listId: string;

  @IsNumber()
  @IsInt()
  @IsPositive()
  @ApiProperty({ description: 'Item quantity', example: 1 })
  quantity: number;
}
