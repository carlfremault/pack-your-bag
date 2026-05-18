import { Module } from '@nestjs/common';

import { InternalGuardModule } from '@repo/nestjs-common';

import { CleanupController } from './cleanup.controller';
import { CleanupService } from './cleanup.service';

@Module({
  imports: [InternalGuardModule],
  controllers: [CleanupController],
  providers: [CleanupService],
})
export class CleanupModule {}
