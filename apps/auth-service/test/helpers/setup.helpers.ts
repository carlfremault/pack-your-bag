import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerStorage } from '@nestjs/throttler';

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
  jwtService: JwtService;
  authHelpers: AuthHelpers;
  storage: ThrottlerStorage;
  bffSecret: string;
  userDeleteRetentionPeriod: number;
  gracePeriod: number;
  accessTokenExpires: number;
  resetDb: () => Promise<void>;
  close: () => Promise<void>;
}

const AUDIT_LOG_FLUSH_TIMEOUT_MS = 500;

export const createIntegrationContext = async (): Promise<IntegrationTestContext> => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app: INestApplication<App> = moduleFixture.createNestApplication();
  const prisma = moduleFixture.get<PrismaService>(PrismaService);
  const tasksService = moduleFixture.get<TasksService>(TasksService);
  const configService = moduleFixture.get<ConfigService>(ConfigService);
  const jwtService = moduleFixture.get<JwtService>(JwtService);
  const storage = moduleFixture.get<ThrottlerStorage>(ThrottlerStorage);

  const bffSecret = configService.getOrThrow<string>('BFF_SHARED_SECRET');
  const userDeleteRetentionPeriod = configService.getOrThrow<number>(
    'AUTH_USER_DELETE_RETENTION_DAYS',
  );
  const gracePeriod = configService.getOrThrow<number>('AUTH_REFRESH_TOKEN_GRACE_PERIOD_MS');
  const accessTokenExpires = configService.getOrThrow<number>(
    'AUTH_ACCESS_TOKEN_EXPIRATION_IN_SECONDS',
  );

  const authHelpers = new AuthHelpers(app, prisma, jwtService, bffSecret);

  await app.init();

  const resetDb = async () => {
    await prisma.auditLog.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
  };

  const close = async () => {
    // Audit logging is asynchronous. Wait for any pending logs to finish processing
    await new Promise((resolve) => setTimeout(resolve, AUDIT_LOG_FLUSH_TIMEOUT_MS));
    await app.close();
    await prisma.$disconnect();
  };

  return {
    app,
    prisma,
    configService,
    jwtService,
    tasksService,
    authHelpers,
    storage,
    bffSecret,
    userDeleteRetentionPeriod,
    gracePeriod,
    accessTokenExpires,
    resetDb,
    close,
  };
};
