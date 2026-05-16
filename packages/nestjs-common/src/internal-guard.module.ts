import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { InternalGuard } from './guards/internal.guard';

@Module({
  imports: [ConfigModule],
  providers: [InternalGuard],
  exports: [InternalGuard],
})
export class InternalGuardModule {}
