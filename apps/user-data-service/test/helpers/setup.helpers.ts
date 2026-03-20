import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { JwtTestHelper } from '@repo/nestjs-common';

import { Model } from 'mongoose';
import { App } from 'supertest/types';

import { AppModule } from '@/app.module';
import { Preference, PreferenceDocument } from '@/preferences/schema/preferences.schema';

import { AuthHelpers } from './auth.helpers';
import { PreferencesHelpers } from './preferences.helpers';

export interface IntegrationTestContext {
  app: INestApplication<App>;
  preferenceModel: Model<PreferenceDocument>;
  configService: ConfigService;
  authHelpers: AuthHelpers;
  preferencesHelpers: PreferencesHelpers;
  bffSecret: string;
  resetDb: () => Promise<void>;
  close: () => Promise<void>;
}

export const createIntegrationContext = async (): Promise<IntegrationTestContext> => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app: INestApplication<App> = moduleFixture.createNestApplication();
  const configService = moduleFixture.get<ConfigService>(ConfigService);
  const preferenceModel = moduleFixture.get<Model<PreferenceDocument>>(
    getModelToken(Preference.name),
  );

  const bffSecret = configService.getOrThrow<string>('BFF_SHARED_SECRET');
  const rsaPrivateKeyB64 = configService.getOrThrow<string>('RSA_PRIVATE_KEY_B64');
  const jwtTestHelper = new JwtTestHelper(rsaPrivateKeyB64);

  await app.init();

  const authHelpers = new AuthHelpers(jwtTestHelper);
  const preferencesHelpers = new PreferencesHelpers(app, bffSecret);

  const resetDb = async () => {
    await preferenceModel.deleteMany({});
  };

  const close = async () => {
    await app.close();
  };

  return {
    app,
    preferenceModel,
    configService,
    authHelpers,
    preferencesHelpers,
    bffSecret,
    resetDb,
    close,
  };
};
