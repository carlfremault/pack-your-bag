import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { type ClientProxy } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerStorage } from '@nestjs/throttler';
import { MailerService } from '@nestjs-modules/mailer';

import { RMQ_PUBLISHERS } from '@repo/nestjs-common';

import { of } from 'rxjs';
import { App } from 'supertest/types';
import { MockInstance, vi } from 'vitest';

import { AppModule } from '@/app.module';
import { VerificationTokenService } from '@/modules/verification-token/verification-token.service';
import { PrismaService } from '@/prisma/prisma.service';
import { TasksService } from '@/tasks/tasks.service';

import { AuthHelpers } from './auth.helpers';

export interface IntegrationTestContext {
  app: INestApplication<App>;
  prisma: PrismaService;
  configService: ConfigService;
  tasksService: TasksService;
  verificationTokenService: VerificationTokenService;
  jwtService: JwtService;
  eventEmitter: EventEmitter2;
  mailerService: MailerService;
  authHelpers: AuthHelpers;
  auditEmitSpy: MockInstance;
  storage: ThrottlerStorage;
  bffSecret: string;
  userDeleteRetentionPeriod: number;
  gracePeriod: number;
  accessTokenExpires: number;
  passwordResetTokenExpiresInMS: number;
  mailpitUrl: string;
  clearMailpit: () => Promise<void>;
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
  const verificationTokenService =
    moduleFixture.get<VerificationTokenService>(VerificationTokenService);
  const configService = moduleFixture.get<ConfigService>(ConfigService);
  const jwtService = moduleFixture.get<JwtService>(JwtService);
  const eventEmitter = moduleFixture.get<EventEmitter2>(EventEmitter2);
  const mailerService = moduleFixture.get<MailerService>(MailerService);
  const storage = moduleFixture.get<ThrottlerStorage>(ThrottlerStorage);

  const bffSecret = configService.getOrThrow<string>('BFF_SHARED_SECRET');
  const userDeleteRetentionPeriod = configService.getOrThrow<number>(
    'AUTH_USER_DELETE_RETENTION_DAYS',
  );
  const gracePeriod = configService.getOrThrow<number>('AUTH_REFRESH_TOKEN_GRACE_PERIOD_MS');
  const accessTokenExpires = configService.getOrThrow<number>(
    'AUTH_ACCESS_TOKEN_EXPIRATION_IN_SECONDS',
  );
  const passwordResetTokenExpiresInMS = configService.getOrThrow<number>(
    'AUTH_PASSWORD_RESET_TOKEN_EXPIRATION_IN_MS',
  );
  const mailpitUrl = configService.getOrThrow<string>('AUTH_MAILPIT_API_URL');

  // Mock the RMQ client BEFORE app.init() to prevent actual RabbitMQ connection
  // attempts during the onApplicationBootstrap lifecycle hook
  const auditClient = app.get<ClientProxy>(RMQ_PUBLISHERS.AUDIT);
  vi.spyOn(auditClient, 'connect').mockResolvedValue(undefined);
  vi.spyOn(auditClient, 'close').mockResolvedValue(undefined);
  const auditEmitSpy = vi.spyOn(auditClient, 'emit').mockReturnValue(of(undefined));

  await app.init();

  const authHelpers = new AuthHelpers(app, prisma, jwtService, bffSecret, auditEmitSpy);

  const resetDb = async () => {
    auditEmitSpy.mockClear();
    await prisma.auditLog.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.verificationToken.deleteMany();
    await prisma.user.deleteMany();
  };

  const clearMailpit = async () => {
    const response = await fetch(`${mailpitUrl}/messages`, { method: 'DELETE' });
    if (!response.ok) {
      throw new Error(`Failed to clear mailpit: ${response.status} ${response.statusText}`);
    }
  };

  const close = async () => {
    await app.close();
    await prisma.$disconnect();
  };

  return {
    app,
    prisma,
    configService,
    jwtService,
    eventEmitter,
    mailerService,
    tasksService,
    verificationTokenService,
    authHelpers,
    auditEmitSpy,
    storage,
    bffSecret,
    userDeleteRetentionPeriod,
    gracePeriod,
    accessTokenExpires,
    passwordResetTokenExpiresInMS,
    mailpitUrl,
    clearMailpit,
    resetDb,
    close,
  };
};
