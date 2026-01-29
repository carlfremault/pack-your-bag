import { HttpStatus, INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import request from 'supertest';
import { App } from 'supertest/types';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AppModule } from '@/app.module';
import { AuthResponseDto } from '@/modules/auth/dto/auth-response.dto';
import { PrismaService } from '@/prisma/prisma.service';

type RefreshTokenContent = {
  jti: string;
  family: string;
};

describe('Auth Refresh Token (e2e)', () => {
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
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  const validUserDto = { email: 'testemail@test.com', password: 'validPassword123' };

  const registerUser = async (dto?: {
    email: string;
    password: string;
  }): Promise<AuthResponseDto> => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(dto || validUserDto)
      .set('x-bff-secret', bffSecret)
      .expect(HttpStatus.CREATED);
    return response.body as AuthResponseDto;
  };

  const refreshToken = async (token: string, expectedStatus = HttpStatus.OK) => {
    return request(app.getHttpServer())
      .post('/auth/refresh-token')
      .set('Authorization', `Bearer ${token}`)
      .set('x-bff-secret', bffSecret)
      .expect(expectedStatus);
  };

  const loginUser = async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .set('x-bff-secret', bffSecret)
      .send(validUserDto)
      .expect(HttpStatus.OK);
    return response.body as AuthResponseDto;
  };
  const logoutUser = async (token: string) => {
    return request(app.getHttpServer())
      .delete('/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .set('x-bff-secret', bffSecret)
      .expect(HttpStatus.NO_CONTENT);
  };

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  describe('Auth Service - /refresh-token (POST)', () => {
    describe('Success cases', () => {
      it('/refresh-token (POST) - should successfully refresh tokens with valid refresh token and prevent reuse', async () => {
        const { access_token: originalAccess, refresh_token: originalRefresh } =
          await registerUser();

        const response = await refreshToken(originalRefresh);
        const body = response.body as AuthResponseDto;
        expect(body).toMatchObject({
          access_token: expect.any(String) as string,
          refresh_token: expect.any(String) as string,
          token_type: 'Bearer',
          expires_in: configService.get<number>('AUTH_ACCESS_TOKEN_EXPIRATION_IN_SECONDS', 900),
          user: {
            id: expect.any(String) as string,
            role: expect.any(Number) as number,
          },
        });

        expect(body.access_token).not.toBe(originalAccess);
        expect(body.refresh_token).not.toBe(originalRefresh);
      });

      it('should successfully refresh multiple times (token rotation)', async () => {
        const initial = await registerUser();

        const refresh1 = await refreshToken(initial.refresh_token);
        const tokens1 = refresh1.body as AuthResponseDto;

        const refresh2 = await refreshToken(tokens1.refresh_token);
        const tokens2 = refresh2.body as AuthResponseDto;

        const refresh3 = await refreshToken(tokens2.refresh_token);
        const tokens3 = refresh3.body as AuthResponseDto;

        expect(tokens1.refresh_token).not.toBe(initial.refresh_token);
        expect(tokens2.refresh_token).not.toBe(tokens1.refresh_token);
        expect(tokens3.refresh_token).not.toBe(tokens2.refresh_token);
      });
    });

    describe('Invalid Token Cases', () => {
      it('should reject malformed refresh token', async () => {
        const response = await refreshToken('not-a-refresh-token', HttpStatus.UNAUTHORIZED);

        expect(response.body).toMatchObject({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: expect.any(String) as string,
          error: expect.any(String) as string,
        });
      });

      it('should reject refresh token with invalid signature', async () => {
        const { refresh_token } = await registerUser();

        // Tamper with the token (Change some characters in the signature)
        const parts = refresh_token.split('.');
        const signature = parts[2] as string;
        const corruptedSignature = 'CorruptedSignature' + signature.substring(20);
        const tamperedToken = `${parts[0]}.${parts[1]}.${corruptedSignature}`;

        const response = await refreshToken(tamperedToken, HttpStatus.UNAUTHORIZED);
        expect((response.body as { error: string }).error).toBe('UNAUTHORIZED');
      });

      it('should reject refresh token that does not exist in database', async () => {
        const { refresh_token } = await registerUser();
        await prisma.refreshToken.deleteMany();

        const response = await refreshToken(refresh_token, HttpStatus.UNAUTHORIZED);
        expect((response.body as { error: string }).error).toBe('INVALID_SESSION');
      });
    });

    describe('Token Reuse Detection', () => {
      it('should detect token reuse attack and revoke entire family', async () => {
        const initial = await registerUser();

        // First refresh: token rotates
        const refresh1 = await refreshToken(initial.refresh_token);
        const tokens1 = refresh1.body as AuthResponseDto;

        // Try to reuse OLD token (outside grace period)
        await sleep(gracePeriod + 1000); // Wait for grace period to expire

        const reuseResponse = await refreshToken(initial.refresh_token, HttpStatus.UNAUTHORIZED);
        expect((reuseResponse.body as { error: string }).error).toBe('SESSION_EXPIRED');

        // NEW token should also be revoked (entire family killed)
        const newTokenResponse = await refreshToken(tokens1.refresh_token, HttpStatus.UNAUTHORIZED);
        expect((newTokenResponse.body as { error: string }).error).toBe('SESSION_EXPIRED');

        // Verify all tokens in family are revoked
        const revokedTokens = await prisma.refreshToken.findMany({
          where: { userId: tokens1.user.id },
        });
        expect(revokedTokens.every((t) => t.isRevoked)).toBe(true);
      });

      it('should handle token reuse after multiple rotations', async () => {
        const initial = await registerUser();

        // Rotate twice
        const refresh1 = await refreshToken(initial.refresh_token);
        const tokens1 = refresh1.body as AuthResponseDto;

        const refresh2 = await refreshToken(tokens1.refresh_token);
        const tokens2 = refresh2.body as AuthResponseDto;

        // Wait for grace period to expire
        await sleep(gracePeriod + 100);

        // Try to reuse the FIRST token (2 rotations ago)
        await refreshToken(initial.refresh_token, HttpStatus.UNAUTHORIZED);

        // All tokens should be revoked
        await refreshToken(tokens1.refresh_token, HttpStatus.UNAUTHORIZED);
        await refreshToken(tokens2.refresh_token, HttpStatus.UNAUTHORIZED);
      });
    });

    describe('Race Condition Handling', () => {
      it('should handle concurrent refresh requests (within grace period)', async () => {
        const { refresh_token } = await registerUser();

        // Send two refresh requests nearly simultaneously
        const [response1, response2] = await Promise.all([
          refreshToken(refresh_token),
          refreshToken(refresh_token),
        ]);

        // Both should succeed (race condition handling)
        expect(response1.status).toBe(HttpStatus.OK);
        expect(response2.status).toBe(HttpStatus.OK);

        const tokens1 = response1.body as AuthResponseDto;
        const tokens2 = response2.body as AuthResponseDto;

        expect(tokens1.refresh_token).toBeDefined();
        expect(tokens2.refresh_token).toBeDefined();
      });

      it('should return latest token when old token used within grace period', async () => {
        const initial = await registerUser();

        // First refresh
        const refresh1 = await refreshToken(initial.refresh_token);
        const tokens1 = refresh1.body as AuthResponseDto;

        // Immediately try to use old token (within grace period)
        const raceResponse = await refreshToken(initial.refresh_token);
        const raceTokens = raceResponse.body as AuthResponseDto;

        expect(raceResponse.status).toBe(HttpStatus.OK);

        // Access Tokens should be different
        expect(raceTokens.access_token).not.toBe(tokens1.access_token);

        // Refresh Tokens should have same jti and family
        const payload1: RefreshTokenContent = jwtService.decode(tokens1.refresh_token);
        const payloadRace: RefreshTokenContent = jwtService.decode(raceTokens.refresh_token);
        expect(payloadRace.jti).toBe(payload1.jti);
        expect(payloadRace.family).toBe(payload1.family);
      });
    });

    describe('Token Expiration', () => {
      it('should reject expired refresh token', async () => {
        const { refresh_token } = await registerUser();
        await prisma.refreshToken.updateMany({
          data: { expiresAt: new Date(Date.now() - 1000) },
        });

        const response = await refreshToken(refresh_token, HttpStatus.UNAUTHORIZED);
        expect((response.body as { error: string }).error).toBe('SESSION_EXPIRED');
      });
    });

    describe('Token Ownership/Family Mismatch', () => {
      it('should detect token ownership mismatch', async () => {
        const user1 = await registerUser();
        const user2 = await registerUser({
          email: 'user2@test.com',
          password: 'validPassword456',
        });
        const user1Token = await prisma.refreshToken.findFirstOrThrow({
          where: { userId: user1.user.id },
        });
        await prisma.refreshToken.update({
          where: { id: user1Token.id },
          data: { userId: user2.user.id },
        });

        const response = await refreshToken(user1.refresh_token, HttpStatus.UNAUTHORIZED);
        expect((response.body as { error: string }).error).toBe('INVALID_SESSION');
      });

      it('should detect token family mismatch', async () => {
        const user = await registerUser();
        const user2 = await registerUser({
          email: 'user2@test.com',
          password: 'validPassword456',
        });
        const user2Token = await prisma.refreshToken.findFirstOrThrow({
          where: { userId: user2.user.id },
        });
        await prisma.refreshToken.updateMany({
          where: { userId: user.user.id },
          data: { family: user2Token.family },
        });

        const response = await refreshToken(user.refresh_token, HttpStatus.UNAUTHORIZED);
        expect((response.body as { error: string }).error).toBe('INVALID_SESSION');
      });
    });
  });

  describe('Auth Service - /logout (DELETE)', () => {
    it('should reject refresh after manual logout, within grace period', async () => {
      const { refresh_token } = await registerUser();
      await logoutUser(refresh_token);

      const response = await refreshToken(refresh_token, HttpStatus.UNAUTHORIZED);
      expect((response.body as { error: string }).error).toBe('SESSION_EXPIRED');
    });

    it('should reject refresh after manual logout, after grace period', async () => {
      const { refresh_token } = await registerUser();
      await logoutUser(refresh_token);

      await sleep(gracePeriod + 100); // Wait for grace period to expire

      const response = await refreshToken(refresh_token, HttpStatus.UNAUTHORIZED);
      expect((response.body as { error: string }).error).toBe('SESSION_EXPIRED');
    });

    it('should allow different devices after single device logout', async () => {
      const device1 = await registerUser();
      const device2 = await loginUser();
      await logoutUser(device1.refresh_token);

      await refreshToken(device1.refresh_token, HttpStatus.UNAUTHORIZED);
      const device2Refresh = await refreshToken(device2.refresh_token);
      expect(device2Refresh.status).toBe(HttpStatus.OK);
    });
  });

  describe('Auth Service - /logout-all (DELETE)', () => {
    it('should revoke all refresh tokens across all devices', async () => {
      const user = await registerUser();
      const device1 = await loginUser();
      const device2 = await loginUser();

      await request(app.getHttpServer())
        .delete('/auth/logout-all')
        .set('Authorization', `Bearer ${user.access_token}`)
        .set('x-bff-secret', bffSecret)
        .expect(HttpStatus.NO_CONTENT);

      await refreshToken(user.refresh_token, HttpStatus.UNAUTHORIZED);
      await refreshToken(device1.refresh_token, HttpStatus.UNAUTHORIZED);
      await refreshToken(device2.refresh_token, HttpStatus.UNAUTHORIZED);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing Authorization header', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh-token')
        .set('x-bff-secret', bffSecret)
        .expect(HttpStatus.UNAUTHORIZED);
      expect(response.body).toMatchObject({
        error: 'UNAUTHORIZED',
        message: 'Unauthorized',
      });
    });

    it('should handle malformed Authorization header', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh-token')
        .set('Authorization', 'InvalidFormat')
        .set('x-bff-secret', bffSecret)
        .expect(HttpStatus.UNAUTHORIZED);
      expect(response.body).toMatchObject({
        error: 'UNAUTHORIZED',
        message: 'Unauthorized',
      });
    });

    it('should reject request with missing x-bff-secret header', async () => {
      const { refresh_token } = await registerUser();
      const response = await request(app.getHttpServer())
        .post('/auth/refresh-token')
        .set('Authorization', `Bearer ${refresh_token}`)
        .expect(HttpStatus.UNAUTHORIZED);
      expect(response.body).toMatchObject({
        error: 'UNAUTHORIZED',
        message: 'Unauthorized',
      });
    });

    it('should reject request with invalid x-bff-secret header', async () => {
      const { refresh_token } = await registerUser();
      const response = await request(app.getHttpServer())
        .post('/auth/refresh-token')
        .set('Authorization', `Bearer ${refresh_token}`)
        .set('x-bff-secret', 'invalid-secret')
        .expect(HttpStatus.UNAUTHORIZED);
      expect(response.body).toMatchObject({
        error: 'UNAUTHORIZED',
        message: 'Unauthorized',
      });
    });

    it('should not accept an access token when a refresh token is needed', async () => {
      const { access_token } = await registerUser();
      const response = await refreshToken(access_token, HttpStatus.UNAUTHORIZED);

      expect(response.body).toMatchObject({
        error: 'INVALID_SESSION',
        message: 'Access Denied',
      });
    });

    it('should not accept a refresh token when an access token is needed', async () => {
      const { refresh_token } = await registerUser();
      const response = await request(app.getHttpServer())
        .delete('/auth/logout-all')
        .set('Authorization', `Bearer ${refresh_token}`)
        .set('x-bff-secret', bffSecret)
        .expect(HttpStatus.UNAUTHORIZED);
      expect(response.body).toMatchObject({
        error: 'INVALID_SESSION',
        message: 'Access Denied',
      });
    });
  });
});
