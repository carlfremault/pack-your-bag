import { IsInt, IsNotEmpty, IsNumber, IsPositive, IsUUID } from 'class-validator';

export class UpsertListInPackDto {
  @IsUUID()
  @IsNotEmpty()
  listId: string;

  @IsUUID()
  @IsNotEmpty()
  packId: string;

  @IsNumber()
  @IsInt()
  @IsPositive()
  quantity: number;
}
