import { Exclude, Expose, Type } from 'class-transformer';

import { PackResponseDto } from '@/modules/pack/dto/pack-response.dto';

@Exclude()
export class TripResponseDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() date: Date | null;
  @Expose() remarks: string | null;

  @Expose()
  @Type(() => PackResponseDto)
  pack: PackResponseDto;
}
