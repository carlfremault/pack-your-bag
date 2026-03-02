import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

import { NAME_MAX_LENGTH, REMARKS_MAX_LENGTH } from '@/common/constants/product.constants';

export class CreateTripDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(NAME_MAX_LENGTH)
  name: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  date?: Date;

  @IsString()
  @IsOptional()
  @MaxLength(REMARKS_MAX_LENGTH)
  remarks?: string;

  @IsUUID()
  @IsOptional()
  packId?: string;
}
