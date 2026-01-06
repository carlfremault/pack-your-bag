import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';

import Joi from 'joi';

import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { AuthModule } from './modules/auth/auth.module';
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

        // Security
        AUTH_BCRYPT_SALT_ROUNDS: Joi.number().min(4).max(14).default(10),

        // Throttling
        AUTH_THROTTLE_TTL: Joi.number().default(60000),
        AUTH_THROTTLE_LIMIT: Joi.number().default(100),

        // Default Role
        AUTH_DEFAULT_USER_ROLE_ID: Joi.number().default(1),

        // JWT
        RSA_PRIVATE_KEY_B64: Joi.string().base64().required().messages({
          'string.base64': 'RSA_PRIVATE_KEY_B64 must be a valid base64 encoded string',
        }),
        AUTH_JWT_EXPIRATION: Joi.number().default(3600),
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get('AUTH_THROTTLE_TTL', 60000),
          limit: config.get('AUTH_THROTTLE_LIMIT', 100),
        },
      ],
    }),
    AuthModule,
    PrismaModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
      }),
    },
    {
      provide: APP_FILTER,
      useClass: PrismaExceptionFilter,
    },
  ],
})
export class AppModule {}
