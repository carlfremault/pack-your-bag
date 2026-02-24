import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { BffGuard } from './guards/bff.guard';

/**
 * Provides BFF guard for NestJS applications.
 *
 * Prerequisites — the consuming app must register these before importing this module:
 * - ConfigModule.forRoot({ isGlobal: true }) — required for ConfigService (BFF_SHARED_SECRET)
 */
@Module({
  imports: [ConfigModule],
  providers: [BffGuard],
  exports: [BffGuard],
})
export class BffGuardModule {}
