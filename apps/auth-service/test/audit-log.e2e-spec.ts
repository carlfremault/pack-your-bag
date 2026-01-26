import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import request from 'supertest';
import { App } from 'supertest/types';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { Prisma } from '@/generated/prisma';
import { AuthResponseDto } from '@/modules/auth/dto/auth-response.dto';
import { PrismaService } from '@/prisma/prisma.service';

import { AppModule } from '../src/app.module';

describe('Audit Log (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let configService: ConfigService;
  let jwtService: JwtService;
  let gracePeriod: number;
  let bffSecret: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    configService = moduleFixture.get(ConfigService);
    jwtService = moduleFixture.get(JwtService);

    gracePeriod = configService.get<number>('AUTH_REFRESH_TOKEN_GRACE_PERIOD_MS', 2000);
    bffSecret = configService.get<string>('BFF_SHARED_SECRET', '');

    await app.init();
  });

  beforeEach(async () => {
    await prisma.auditLog.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    // Audit logging is asynchronous. Wait for it to finish
    await new Promise((resolve) => setTimeout(resolve, 500));
    await app.close();
    await prisma.$disconnect();
  });

  const validUserDto = { email: 'testemail@test.com', password: 'validPassword123' };

  const waitForLog = async (where: Prisma.AuditLogWhereInput, maxAttempts = 20) => {
    for (let i = 0; i < maxAttempts; i++) {
      const log = await prisma.auditLog.findFirst({ where, orderBy: { createdAt: 'desc' } });
      if (log) return log;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error(`Audit log not found for conditions: ${JSON.stringify(where)}`);
  };

  const registerUser = async (): Promise<AuthResponseDto> => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .set('x-bff-secret', bffSecret)
      .send(validUserDto)
      .expect(201);
    return response.body as AuthResponseDto;
  };

  const refreshToken = async (token: string, expectedStatus = 200) => {
    return request(app.getHttpServer())
      .post('/auth/refresh-token')
      .set('Authorization', `Bearer ${token}`)
      .set('x-bff-secret', bffSecret)
      .expect(expectedStatus);
  };

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  describe('Auth Service - Audit Log', () => {
    it('should create an audit log entry for a successful operation', async () => {
      const response = await registerUser();
      const auditLogEntry = await waitForLog({
        userId: response.user.id,
        eventType: 'USER_REGISTERED',
      });

      expect(auditLogEntry).toMatchObject({
        severity: 'INFO',
        userId: response.user.id,
        path: '/auth/register',
        method: 'POST',
        statusCode: 201,
      });
    });

    it('should create an audit log entry for a failed operation', async () => {
      const response = await registerUser();
      const { refresh_token, user } = response;
      const payload: { jti: string; family: string } = jwtService.decode(refresh_token);
      await refreshToken(refresh_token);

      // Try to reuse OLD token (outside grace period)
      await sleep(gracePeriod + 100);
      await refreshToken(refresh_token, 401);

      const auditLogEntry = await waitForLog({
        userId: user.id,
        eventType: 'TOKEN_REUSE_DETECTED',
      });

      expect(auditLogEntry).toMatchObject({
        severity: 'CRITICAL',
        userId: user.id,
        path: '/auth/refresh-token',
        method: 'POST',
        statusCode: 401,
        metadata: {
          tokenId: payload.jti,
          tokenFamily: payload.family,
        },
      });
    });
  });
});
