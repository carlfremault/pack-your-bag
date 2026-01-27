import { HttpStatus, INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerStorage } from '@nestjs/throttler';

import request from 'supertest';
import { App } from 'supertest/types';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { THROTTLE_LIMITS } from '@/common/constants/auth.constants';
import { AuditEventType, AuditSeverity, Prisma } from '@/generated/prisma';
import { AuthResponseDto } from '@/modules/auth/dto/auth-response.dto';
import { PrismaService } from '@/prisma/prisma.service';

import { AppModule } from '../src/app.module';

const AUDIT_LOG_FLUSH_TIMEOUT_MS = 500;

describe('Custom Throttler Log (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let configService: ConfigService;
  let storage: ThrottlerStorage;

  let bffSecret: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    configService = moduleFixture.get(ConfigService);
    storage = moduleFixture.get<ThrottlerStorage>(ThrottlerStorage);

    bffSecret = configService.get<string>('BFF_SHARED_SECRET', '');

    await app.init();
  });

  beforeEach(async () => {
    await prisma.auditLog.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
  });

  afterEach(() => {
    // We need to reset the throttle storage after each test
    // Accessing internal ThrottlerStorage structure - may break if library internals change
    const internalStorage = storage as unknown as Record<string, Map<string, number>>;
    if (internalStorage.storage instanceof Map) {
      internalStorage.storage.clear();
    }
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

  const registerUser = async (
    dto?: { email: string; password: string },
    expectedStatus = HttpStatus.CREATED,
  ): Promise<AuthResponseDto> => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .set('x-force-throttling', 'true')
      .set('x-bff-secret', bffSecret)
      .send(dto || validUserDto)
      .expect(expectedStatus);
    return response.body as AuthResponseDto;
  };

  const loginUser = async (expectedStatus = HttpStatus.OK) => {
    return await request(app.getHttpServer())
      .post('/auth/login')
      .set('x-force-throttling', 'true')
      .set('x-bff-secret', bffSecret)
      .send(validUserDto)
      .expect(expectedStatus);
  };

  const updatePassword = async (
    token: string,
    body: { currentPassword?: string; newPassword?: string },
    expectedStatus = HttpStatus.OK,
  ) => {
    return request(app.getHttpServer())
      .patch(`/auth/update-password`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-force-throttling', 'true')
      .set('x-bff-secret', bffSecret)
      .send(body)
      .expect(expectedStatus);
  };

  describe('Auth Service - Custom Throttler', () => {
    it('should trigger custom throttler guard and create an audit log entry - ip based tracking', async () => {
      for (let i = 0; i < THROTTLE_LIMITS.REGISTER; i++) {
        await registerUser({
          email: `testemail${i}@test.com`,
          password: 'validPassword123',
        });
      }
      await registerUser(validUserDto, HttpStatus.TOO_MANY_REQUESTS);

      const auditLogEntry = await waitForLog({
        eventType: AuditEventType.SECURITY_RATE_LIMIT_EXCEEDED,
      });

      expect(auditLogEntry).toMatchObject({
        severity: AuditSeverity.WARN,
        ipAddress: expect.any(String) as string,
        path: '/auth/register',
        method: 'POST',
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
      });

      expect(auditLogEntry.metadata).toBeTruthy();
      const metadata = auditLogEntry.metadata as Record<string, unknown>;
      expect(metadata.tracker).toContain('ip:');
    });

    it('should trigger custom throttler guard and create an audit log entry - email based tracking', async () => {
      await registerUser(validUserDto);
      for (let i = 0; i < THROTTLE_LIMITS.LOGIN; i++) {
        await loginUser();
      }
      await loginUser(HttpStatus.TOO_MANY_REQUESTS);

      const auditLogEntry = await waitForLog({
        eventType: AuditEventType.SECURITY_RATE_LIMIT_EXCEEDED,
      });

      expect(auditLogEntry).toMatchObject({
        severity: AuditSeverity.WARN,
        ipAddress: expect.any(String) as string,
        path: '/auth/login',
        method: 'POST',
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
      });

      expect(auditLogEntry.metadata).toBeTruthy();
      const metadata = auditLogEntry.metadata as Record<string, unknown>;
      expect(metadata.tracker).toContain('ip-email:');
    });

    it('should trigger custom throttler guard and create an audit log entry - userId based tracking', async () => {
      const { access_token } = await registerUser(validUserDto);
      await updatePassword(access_token, {
        currentPassword: 'validPassword123',
        newPassword: 'validPassword456',
      });
      await updatePassword(access_token, {
        currentPassword: 'validPassword456',
        newPassword: 'validPassword789',
      });
      await updatePassword(access_token, {
        currentPassword: 'validPassword789',
        newPassword: 'validPassword123',
      });
      await updatePassword(
        access_token,
        { currentPassword: 'validPassword123', newPassword: 'validPassword456' },
        HttpStatus.TOO_MANY_REQUESTS,
      );

      const auditLogEntry = await waitForLog({
        eventType: AuditEventType.SECURITY_RATE_LIMIT_EXCEEDED,
      });

      expect(auditLogEntry).toMatchObject({
        severity: AuditSeverity.WARN,
        ipAddress: expect.any(String) as string,
        path: '/auth/update-password',
        method: 'PATCH',
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
      });

      expect(auditLogEntry.metadata).toBeTruthy();
      const metadata = auditLogEntry.metadata as Record<string, unknown>;
      expect(metadata.tracker).toContain('user:');
    });
  });
});
