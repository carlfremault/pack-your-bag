import { MiddlewareConsumer, Module, NestModule, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { MailerModule } from '@nestjs-modules/mailer';

import {
  BffGuardModule,
  CustomThrottlerModule,
  JwtAuthModule,
  RequestIdMiddleware,
} from '@repo/nestjs-common';

import { SentryModule } from '@sentry/nestjs/setup';
import type { Request } from 'express';
import Joi from 'joi';

import { AuthExceptionFilter } from './common/filters/auth-exception.filter';
import { GlobalExceptionsFilter } from './common/filters/global-exceptions.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { UserModule } from './modules/user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { TasksModule } from './tasks/tasks.module';

const validationSchema = Joi.object({
  // Environment
  NODE_ENV: Joi.string().valid('development', 'test', 'production').required(),
  FRONTEND_URL: Joi.string().uri().required(),

  // Security
  TRUST_PROXY: Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean()).required(),
  BFF_SHARED_SECRET: Joi.string().required(),
  INTERNAL_SERVICE_SECRET: Joi.string().required(),

  // Service URLs (for cross-service cleanup after user account deletion)
  PRODUCT_SERVICE_URL: Joi.string().uri().required(),
  USER_DATA_SERVICE_URL: Joi.string().uri().required(),

  // Application
  AUTH_PORT: Joi.number().default(8001),
  AUTH_HEALTH_DISK_PATH: Joi.string().default('/'),

  // Database
  POSTGRES_AUTH_USER: Joi.string().required(),
  POSTGRES_AUTH_PASSWORD: Joi.string().required(),
  POSTGRES_AUTH_SCHEMA: Joi.string().required(),
  POSTGRES_AUTH_URL: Joi.string().uri().required(),

  // DB Pool
  AUTH_DB_POOL_MAX: Joi.number().min(1).max(50).default(20),
  AUTH_DB_IDLE_TIMEOUT: Joi.number().min(1000).max(30000).default(30000),
  AUTH_DB_CONN_TIMEOUT: Joi.number().min(1000).max(10000).default(5000),

  // Hashing
  AUTH_BCRYPT_SALT_ROUNDS: Joi.number().when('NODE_ENV', {
    is: 'test',
    then: Joi.number().min(4).max(14).default(4),
    otherwise: Joi.number().min(10).max(14).default(10),
  }),

  // Throttling
  AUTH_THROTTLE_TTL: Joi.number().default(60000),
  AUTH_THROTTLE_LIMIT: Joi.number().default(100),

  // Tokens
  RSA_PRIVATE_KEY_B64: Joi.string().base64().required().messages({
    'string.base64': 'RSA_PRIVATE_KEY_B64 must be a valid base64 encoded string',
  }),
  RSA_PUBLIC_KEY_B64: Joi.string().base64().required().messages({
    'string.base64': 'RSA_PUBLIC_KEY_B64 must be a valid base64 encoded string',
  }),
  AUTH_ACCESS_TOKEN_EXPIRATION_IN_SECONDS: Joi.number().default(900),
  AUTH_REFRESH_TOKEN_EXPIRATION_IN_SECONDS: Joi.number().default(604800),
  AUTH_REFRESH_TOKEN_GRACE_PERIOD_MS: Joi.number().default(30000),
  AUTH_REFRESH_TOKEN_DB_RETENTION_DAYS: Joi.number().min(1).default(14),
  AUTH_VERIFICATION_TOKEN_RETENTION_DAYS: Joi.number().min(1).default(1),
  AUTH_PASSWORD_RESET_TOKEN_EXPIRATION_IN_MS: Joi.number().default(900000),
  AUTH_EMAIL_VERIFICATION_TOKEN_EXPIRATION_IN_MS: Joi.number().default(3600000),

  // Logging
  AUDIT_LOG_CRITICAL_RETENTION_DAYS: Joi.number().min(1).default(90),
  AUDIT_LOG_ERROR_WARN_RETENTION_DAYS: Joi.number().min(1).default(60),
  AUDIT_LOG_INFO_RETENTION_DAYS: Joi.number().min(1).default(30),

  // User
  AUTH_USER_DELETE_RETENTION_DAYS: Joi.number().min(1).default(30),

  // Sentry
  SENTRY_DSN: Joi.string()
    .uri()
    .when('NODE_ENV', {
      is: Joi.valid('production', 'development'),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),

  // Mailing
  AUTH_MAIL_HOST: Joi.string().required(),
  AUTH_MAIL_PORT: Joi.number().required(),
  AUTH_MAIL_SECURE: Joi.boolean().required(),
  AUTH_MAIL_IGNORE_TLS: Joi.boolean().required(),
  AUTH_MAIL_USER: Joi.string().optional().allow(''),
  AUTH_MAIL_PASS: Joi.string().optional().allow(''),
  AUTH_MAIL_FROM: Joi.string().required(),
  AUTH_MAIL_MAX_RETRIES: Joi.number().min(0).max(10).default(3),
  AUTH_MAIL_RETRY_DELAY_MS: Joi.number().min(100).max(60000).default(1000),
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
          ttl: config.get('AUTH_THROTTLE_TTL', 60000),
          limit: config.get('AUTH_THROTTLE_LIMIT', 100),
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
    CustomThrottlerModule,
    JwtAuthModule,
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get<string>('AUTH_MAIL_HOST'),
          port: config.get<number>('AUTH_MAIL_PORT'),
          secure: config.get('AUTH_MAIL_SECURE'),
          ignoreTLS: config.get('AUTH_MAIL_IGNORE_TLS'),
          auth: config.get('AUTH_MAIL_USER')
            ? {
                user: config.get('AUTH_MAIL_USER'),
                pass: config.get('AUTH_MAIL_PASS'),
              }
            : undefined,
        },
        defaults: {
          from: config.get('AUTH_MAIL_FROM'),
        },
      }),
    }),
    AuditLogModule,
    AuthModule,
    UserModule,
    HealthModule,
    TasksModule,
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
      useClass: AuthExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: PrismaExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
