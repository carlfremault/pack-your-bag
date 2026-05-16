import { ApiProperty } from '@nestjs/swagger';

import { ArrayMaxSize, ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class CleanupUsersDto {
  @ApiProperty({
    description: 'Array of user IDs to clean up',
    type: [String],
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsArray()
  @IsUUID('all', { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  userIds: string[];
}

export class CleanupResultDto {
  @ApiProperty({ description: 'Number of preference documents deleted' })
  deletedPreferences: number;
}
