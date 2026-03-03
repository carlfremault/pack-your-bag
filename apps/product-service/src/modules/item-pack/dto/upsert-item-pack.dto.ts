import { IsInt, IsNotEmpty, IsNumber, IsPositive, IsUUID } from 'class-validator';

export class UpsertItemInPackDto {
  @IsUUID()
  @IsNotEmpty()
  itemId: string;

  @IsUUID()
  @IsNotEmpty()
  packId: string;

  @IsNumber()
  @IsInt()
  @IsPositive()
  quantity: number;
}
