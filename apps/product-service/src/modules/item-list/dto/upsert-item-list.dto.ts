import { IsInt, IsNotEmpty, IsNumber, IsPositive, IsUUID } from 'class-validator';

export class UpsertItemOnListDto {
  @IsUUID()
  @IsNotEmpty()
  itemId: string;

  @IsUUID()
  @IsNotEmpty()
  listId: string;

  @IsNumber()
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  quantity: number;
}
