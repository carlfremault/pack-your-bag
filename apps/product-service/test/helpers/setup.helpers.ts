import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { JwtTestHelper } from '@repo/nestjs-common';

import { App } from 'supertest/types';

import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';

import { AuthHelpers } from './auth.helpers';
import { CategoryHelpers } from './category.helpers';
import { ItemHelpers } from './item.helpers';
import { ItemListHelpers } from './item-list.helpers';
import { ItemPackHelpers } from './item-pack.helpers';
import { ListHelpers } from './list.helpers';
import { PackHelpers } from './pack.helpers';
import { TripHelpers } from './trip.helpers';

export interface IntegrationTestContext {
  app: INestApplication<App>;
  prisma: PrismaService;
  configService: ConfigService;
  authHelpers: AuthHelpers;
  categoryHelpers: CategoryHelpers;
  itemHelpers: ItemHelpers;
  listHelpers: ListHelpers;
  packHelpers: PackHelpers;
  tripHelpers: TripHelpers;
  itemListHelpers: ItemListHelpers;
  itemPackHelpers: ItemPackHelpers;
  bffSecret: string;
  resetDb: () => Promise<void>;
  close: () => Promise<void>;
}

export const createIntegrationContext = async (): Promise<IntegrationTestContext> => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app: INestApplication<App> = moduleFixture.createNestApplication();
  const prisma = moduleFixture.get<PrismaService>(PrismaService);
  const configService = moduleFixture.get<ConfigService>(ConfigService);

  const bffSecret = configService.getOrThrow<string>('BFF_SHARED_SECRET');
  const rsaPrivateKeyB64 = configService.getOrThrow<string>('RSA_PRIVATE_KEY_B64');
  const jwtTestHelper = new JwtTestHelper(rsaPrivateKeyB64);

  const authHelpers = new AuthHelpers(jwtTestHelper);
  const categoryHelpers = new CategoryHelpers(app, bffSecret);
  const itemHelpers = new ItemHelpers(app, bffSecret);
  const listHelpers = new ListHelpers(app, bffSecret);
  const packHelpers = new PackHelpers(app, bffSecret);
  const tripHelpers = new TripHelpers(app, bffSecret);

  const itemListHelpers = new ItemListHelpers(app, bffSecret);
  const itemPackHelpers = new ItemPackHelpers(app, bffSecret);

  await app.init();

  const resetDb = async () => {
    await prisma.itemList.deleteMany();
    await prisma.itemPack.deleteMany();
    await prisma.item.deleteMany();
    await prisma.category.deleteMany();
  };

  const close = async () => {
    await app.close();
    await prisma.$disconnect();
  };

  return {
    app,
    prisma,
    configService,
    authHelpers,
    categoryHelpers,
    itemHelpers,
    listHelpers,
    packHelpers,
    tripHelpers,
    itemListHelpers,
    itemPackHelpers,
    bffSecret,
    resetDb,
    close,
  };
};
