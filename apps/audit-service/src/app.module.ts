import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { RequestIdMiddleware } from '@repo/nestjs-common';

import { SentryModule } from '@sentry/nestjs/setup';
import Joi from 'joi';

import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { HealthModule } from './modules/health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { TasksModule } from './tasks/tasks.module';

const validationSchema = Joi.object({
  // Environment
  NODE_ENV: Joi.string().valid('development', 'test', 'production').required(),

  // Application
  AUDIT_PORT: Joi.number().default(8004),
  AUDIT_HEALTH_DISK_PATH: Joi.string().default('/'),

  // RabbitMQ
  RABBITMQ_URL: Joi.string().required(),

  // Database
  POSTGRES_AUDIT_USER: Joi.string().required(),
  POSTGRES_AUDIT_PASSWORD: Joi.string().required(),
  POSTGRES_AUDIT_SCHEMA: Joi.string().required(),
  POSTGRES_AUDIT_URL: Joi.string().uri().required(),

  // DB Pool
  AUDIT_DB_POOL_MAX: Joi.number().min(1).max(50).default(20),
  AUDIT_DB_IDLE_TIMEOUT: Joi.number().min(1000).max(30000).default(30000),
  AUDIT_DB_CONN_TIMEOUT: Joi.number().min(1000).max(10000).default(5000),

  // Logging
  AUDIT_LOG_CRITICAL_RETENTION_DAYS: Joi.number().min(1).default(90),
  AUDIT_LOG_ERROR_WARN_RETENTION_DAYS: Joi.number().min(1).default(60),
  AUDIT_LOG_INFO_RETENTION_DAYS: Joi.number().min(1).default(30),

  // Sentry
  DEV_SENTRY_DSN: Joi.string()
    .uri()
    .when('NODE_ENV', {
      is: Joi.valid('development'),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  AUDIT_SENTRY_DSN: Joi.string()
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
    ScheduleModule.forRoot(),
    PrismaModule,
    HealthModule,
    AuditLogModule,
    TasksModule,
  ],
  // providers: [
  //   {
  //     provide: APP_FILTER,
  //     useClass: GlobalExceptionsFilter,
  //   },
  //   {
  //     provide: APP_FILTER,
  //     useClass: PrismaExceptionFilter,
  //   },
  // ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
