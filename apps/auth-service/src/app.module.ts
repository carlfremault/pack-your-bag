import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import Joi from 'joi';

import { AuthExceptionFilter } from './common/filters/auth-exception.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { AuditLogModule } from './modules/audit/audit-log.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        // Application
        AUTH_PORT: Joi.number().default(8001),

        // Database
        AUTH_USER: Joi.string().required(),
        AUTH_PASSWORD: Joi.string().required(),
        AUTH_SCHEMA: Joi.string().required(),
        AUTH_URL: Joi.string().uri().required(),

        // DB Pool
        AUTH_DB_POOL_MAX: Joi.number().min(1).max(50).default(20),
        AUTH_DB_IDLE_TIMEOUT: Joi.number().min(1000).max(30000).default(30000),
        AUTH_DB_CONN_TIMEOUT: Joi.number().min(1000).max(10000).default(5000),

        // Security
        AUTH_BCRYPT_SALT_ROUNDS: Joi.number().min(10).max(14).default(10),

        // Throttling
        AUTH_THROTTLE_TTL: Joi.number().default(60000),
        AUTH_THROTTLE_LIMIT: Joi.number().default(100),

        // JWT
        RSA_PRIVATE_KEY_B64: Joi.string().base64().required().messages({
          'string.base64': 'RSA_PRIVATE_KEY_B64 must be a valid base64 encoded string',
        }),
        AUTH_ACCESS_TOKEN_EXPIRATION_IN_SECONDS: Joi.number().default(900),
        AUTH_REFRESH_TOKEN_EXPIRATION_IN_SECONDS: Joi.number().default(604800),
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get('AUTH_THROTTLE_TTL', 60000),
          limit: config.get('AUTH_THROTTLE_LIMIT', 100),
          skipIf: () => config.get('NODE_ENV') === 'test',
        },
      ],
    }),
    EventEmitterModule.forRoot(),
    PrismaModule,
    AuthModule,
    UserModule,
    AuditLogModule,
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
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
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
export class AppModule {}
