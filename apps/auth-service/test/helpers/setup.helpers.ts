import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { App } from 'supertest/types';

import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import { TasksService } from '@/tasks/tasks.service';

import { AuthHelpers } from './auth.helpers';

export interface IntegrationTestContext {
  app: INestApplication<App>;
  prisma: PrismaService;
  configService: ConfigService;
  tasksService: TasksService;
  authHelpers: AuthHelpers;
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
  const tasksService = moduleFixture.get<TasksService>(TasksService);
  const configService = moduleFixture.get(ConfigService);
  const bffSecret = configService.get<string>('BFF_SHARED_SECRET');

  if (!bffSecret) {
    throw new Error('BFF_SHARED_SECRET is not set');
  }

  const authHelpers = new AuthHelpers(app, prisma, bffSecret);

  await app.init();

  const resetDb = async () => {
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
    await prisma.auditLog.deleteMany();
  };

  const close = async () => {
    await app.close();
    await prisma.$disconnect();
  };

  return {
    app,
    prisma,
    configService,
    tasksService,
    authHelpers,
    bffSecret,
    resetDb,
    close,
  };
};
