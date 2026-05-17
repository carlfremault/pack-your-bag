import { Module } from '@nestjs/common';

import { InternalGuardModule } from '@repo/nestjs-common';

import { GuestSeedController } from './guest-seed.controller';
import { GuestSeedService } from './guest-seed.service';

@Module({
  imports: [InternalGuardModule],
  controllers: [GuestSeedController],
  providers: [GuestSeedService],
})
export class GuestSeedModule {}
