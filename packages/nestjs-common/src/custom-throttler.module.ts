import { Module } from '@nestjs/common';

import { CustomThrottlerGuard } from './guards/custom-throttler.guard';

@Module({
  providers: [CustomThrottlerGuard],
  exports: [CustomThrottlerGuard],
})
export class CustomThrottlerModule {}
