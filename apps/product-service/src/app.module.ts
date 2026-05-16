import { MiddlewareConsumer, Module, NestModule, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';

import {
  BffGuardModule,
  CustomThrottlerModule,
  InternalGuardModule,
  JwtAuthModule,
  RequestIdMiddleware,
} from '@repo/nestjs-common';

import { SentryModule } from '@sentry/nestjs/setup';
import type { Request } from 'express';
import Joi from 'joi';

import { GlobalExceptionsFilter } from './common/filters/global-exceptions.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { CategoryModule } from './modules/category/category.module';
import { CleanupModule } from './modules/cleanup/cleanup.module';
import { HealthModule } from './modules/health/health.module';
import { ItemModule } from './modules/item/item.module';
import { ItemListModule } from './modules/item-list/item-list.module';
import { ItemPackModule } from './modules/item-pack/item-pack.module';
import { ListModule } from './modules/list/list.module';
import { ListPackModule } from './modules/list-pack/list-pack.module';
import { PackModule } from './modules/pack/pack.module';
import { TripModule } from './modules/trip/trip.module';
import { PrismaModule } from './prisma/prisma.module';

const validationSchema = Joi.object({
  // Environment
  NODE_ENV: Joi.string().valid('development', 'test', 'production').required(),

  // Security
  TRUST_PROXY: Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean()).required(),
  BFF_SHARED_SECRET: Joi.string().required(),
  INTERNAL_SERVICE_SECRET: Joi.string().required(),

  // Application
  PRODUCT_PORT: Joi.number().default(8002),
  PRODUCT_HEALTH_DISK_PATH: Joi.string().default('/'),

  // Database
  POSTGRES_PRODUCT_USER: Joi.string().required(),
  POSTGRES_PRODUCT_PASSWORD: Joi.string().required(),
  POSTGRES_PRODUCT_SCHEMA: Joi.string().required(),
  POSTGRES_PRODUCT_URL: Joi.string().uri().required(),

  // DB Pool
  PRODUCT_DB_POOL_MAX: Joi.number().min(1).max(50).default(20),
  PRODUCT_DB_IDLE_TIMEOUT: Joi.number().min(1000).max(30000).default(30000),
  PRODUCT_DB_CONN_TIMEOUT: Joi.number().min(1000).max(10000).default(5000),

  // Throttling
  PRODUCT_THROTTLE_TTL: Joi.number().default(60000),
  PRODUCT_THROTTLE_LIMIT: Joi.number().default(100),

  // Tokens
  RSA_PUBLIC_KEY_B64: Joi.string().base64().required().messages({
    'string.base64': 'RSA_PUBLIC_KEY_B64 must be a valid base64 encoded string',
  }),

  // Sentry
  SENTRY_DSN: Joi.string()
    .uri()
    .when('NODE_ENV', {
      is: Joi.valid('production', 'development'),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
});

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get('PRODUCT_THROTTLE_TTL', 60000),
          limit: config.get('PRODUCT_THROTTLE_LIMIT', 100),
          skipIf: (context) => {
            const isTestEnv = config.get('NODE_ENV') === 'test';
            if (!isTestEnv) return false;
            const req = context.switchToHttp().getRequest<Request>();
            return !req.headers['x-force-throttling'];
          },
        },
      ],
    }),
    PrismaModule,
    BffGuardModule,
    InternalGuardModule,
    CustomThrottlerModule,
    JwtAuthModule,
    CleanupModule,
    ItemModule,
    CategoryModule,
    ListModule,
    PackModule,
    TripModule,
    ItemListModule,
    ItemPackModule,
    ListPackModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: PrismaExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
