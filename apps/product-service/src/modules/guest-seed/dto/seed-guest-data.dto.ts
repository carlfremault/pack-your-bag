import { ApiProperty } from '@nestjs/swagger';

import { IsUUID } from 'class-validator';

export class SeedGuestDataDto {
  @ApiProperty({
    description: 'User ID to seed guest data for',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  userId: string;
}

export class SeedGuestDataResultDto {
  @ApiProperty({ description: 'Number of categories created' })
  categories: number;

  @ApiProperty({ description: 'Number of items created' })
  items: number;

  @ApiProperty({ description: 'Number of lists created' })
  lists: number;

  @ApiProperty({ description: 'Number of packs created' })
  packs: number;

  @ApiProperty({ description: 'Number of trips created' })
  trips: number;
}
