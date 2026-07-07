import { MiddlewareConsumer, Module, NestModule, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';

import {
  AuditLogModule,
  BffGuardModule,
  CustomThrottlerModule,
  JwtAuthModule,
  RequestIdMiddleware,
} from '@repo/nestjs-common';

import { SentryModule } from '@sentry/nestjs/setup';
import type { Request } from 'express';
import Joi from 'joi';

import { CleanupModule } from './cleanup/cleanup.module';
import { GlobalExceptionsFilter } from './common/filters/global-exceptions.filter';
import { MongooseExceptionFilter } from './common/filters/mongoose-exception.filter';
import { HealthModule } from './health/health.module';
import { PreferencesModule } from './preferences/preferences.module';

const validationSchema = Joi.object({
  // Environment
  NODE_ENV: Joi.string().valid('development', 'test', 'production').required(),

  // Security
  TRUST_PROXY: Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean()).required(),
  BFF_SHARED_SECRET: Joi.string().required(),

  // Application
  UDS_PORT: Joi.number().default(8003),
  USER_DATA_HEALTH_DISK_PATH: Joi.string().default('/'),

  // Database
  MONGO_DB_URL: Joi.string().uri().required(),
  MONGO_DB_NAME: Joi.string().required(),

  // RabbitMQ
  RABBITMQ_URL: Joi.string().required(),

  // Throttling
  USER_DATA_THROTTLE_TTL: Joi.number().default(60000),
  USER_DATA_THROTTLE_LIMIT: Joi.number().default(100),

  // Tokens
  RSA_PUBLIC_KEY_B64: Joi.string().base64().required().messages({
    'string.base64': 'RSA_PUBLIC_KEY_B64 must be a valid base64 encoded string',
  }),

  // Sentry
  DEV_SENTRY_DSN: Joi.string()
    .uri()
    .when('NODE_ENV', {
      is: Joi.valid('development'),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  USER_DATA_SENTRY_DSN: Joi.string()
    .uri()
    .when('NODE_ENV', {
      is: Joi.valid('production'),
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
          ttl: config.get('USER_DATA_THROTTLE_TTL', 60000),
          limit: config.get('USER_DATA_THROTTLE_LIMIT', 100),
          skipIf: (context) => {
            const isTestEnv = config.get('NODE_ENV') === 'test';
            if (!isTestEnv) return false;
            const req = context.switchToHttp().getRequest<Request>();
            return !req.headers['x-force-throttling'];
          },
        },
      ],
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow('MONGO_DB_URL'),
        dbName: config.getOrThrow('MONGO_DB_NAME'),
      }),
    }),
    AuditLogModule.forRoot({ source: 'user-data-service' }),
    BffGuardModule,
    CustomThrottlerModule,
    JwtAuthModule,
    CleanupModule,
    PreferencesModule,
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
      useClass: MongooseExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
