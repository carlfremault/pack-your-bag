import { ApiProperty } from '@nestjs/swagger';

import { IsInt, IsNotEmpty, IsNumber, IsPositive, IsUUID } from 'class-validator';
export class UpsertListInPackDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'List uuid', example: '123e4567-e89b-12d3-a456-426614174000' })
  listId: string;

  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'Pack uuid', example: '987fcdeb-51a2-3bc4-d567-890123456789' })
  packId: string;

  @IsNumber()
  @IsInt()
  @IsPositive()
  @ApiProperty({ description: 'List quantity', example: 1 })
  quantity: number;
}
