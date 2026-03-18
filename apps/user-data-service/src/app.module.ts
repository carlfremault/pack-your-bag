import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import Joi from 'joi';

import { PreferencesModule } from './preferences/preferences.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

const validationSchema = Joi.object({
  // Environment
  NODE_ENV: Joi.string().valid('development', 'test', 'production').required(),

  // Database
  MONGO_DB_URL: Joi.string().uri().required(),
  MONGO_DB_NAME: Joi.string().required(),
});

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow('MONGO_DB_URL'),
        dbName: config.getOrThrow('MONGO_DB_NAME'),
      }),
    }),
    PreferencesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
