import { Controller, Get, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { CustomThrottlerGuard, JwtAuthGuard } from '@repo/nestjs-common';

import { THROTTLE_LIMITS, THROTTLE_TTL_MS } from '@/common/constants/product.constants';

import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @UseGuards(JwtAuthGuard, CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.TEST, ttl: THROTTLE_TTL_MS } })
  getHello(): string {
    return this.appService.getHello();
  }
}
