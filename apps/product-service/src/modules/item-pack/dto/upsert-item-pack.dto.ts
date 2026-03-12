import { ApiProperty } from '@nestjs/swagger';

import { IsInt, IsNotEmpty, IsNumber, IsPositive, IsUUID } from 'class-validator';
export class UpsertItemInPackDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'Item uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  itemId: string;

  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'Pack uuid', example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  packId: string;

  @IsNumber()
  @IsInt()
  @IsPositive()
  @ApiProperty({ description: 'Item quantity', example: 1 })
  quantity: number;
}
