import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';

import { InternalGuard } from '@repo/nestjs-common';

import { SeedGuestDataDto, SeedGuestDataResultDto } from './dto/seed-guest-data.dto';
import { GuestSeedService } from './guest-seed.service';

@ApiTags('internal')
@ApiSecurity('internal-secret')
@Controller('internal/guest-seed')
@UseGuards(InternalGuard)
export class GuestSeedController {
  constructor(private readonly guestSeedService: GuestSeedService) {}

  @Post()
  @ApiOperation({ summary: 'Seed sample product data for a guest user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Guest data seeded successfully.',
    type: SeedGuestDataResultDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.' })
  @HttpCode(HttpStatus.OK)
  async seedGuestData(@Body() body: SeedGuestDataDto): Promise<SeedGuestDataResultDto> {
    return this.guestSeedService.seedGuestData(body.userId);
  }
}
