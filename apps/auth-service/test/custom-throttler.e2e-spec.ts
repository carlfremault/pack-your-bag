import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import request from 'supertest';
import { App } from 'supertest/types';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AUDIT_LOG_FLUSH_TIMEOUT_MS } from '@/common/constants/auth.constants';
import { Prisma } from '@/generated/prisma';
import { AuthResponseDto } from '@/modules/auth/dto/auth-response.dto';
import { PrismaService } from '@/prisma/prisma.service';

import { AppModule } from '../src/app.module';

describe('Custom Throttler Log (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let configService: ConfigService;
  let bffSecret: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    configService = moduleFixture.get(ConfigService);

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
    await new Promise((resolve) => setTimeout(resolve, AUDIT_LOG_FLUSH_TIMEOUT_MS));
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

  const loginUser = async (expectedStatus = 200) => {
    return await request(app.getHttpServer())
      .post('/auth/login')
      .set('x-force-throttling', 'true')
      .set('x-bff-secret', bffSecret)
      .send(validUserDto)
      .expect(expectedStatus);
  };

  describe('Auth Service - Custom Throttler', () => {
    it('should trigger custom throttler guard and create an audit log entry when throttle limit exceeded', async () => {
      await registerUser();
      for (let i = 0; i < 10; i++) {
        await loginUser();
      }
      await loginUser(429);

      const auditLogEntry = await waitForLog({
        eventType: 'SECURITY_RATE_LIMIT_EXCEEDED',
      });

      expect(auditLogEntry).toMatchObject({
        severity: 'WARN',
        ipAddress: expect.any(String) as string,
        path: '/auth/login',
        method: 'POST',
        statusCode: 429,
      });
    });
  });
});
