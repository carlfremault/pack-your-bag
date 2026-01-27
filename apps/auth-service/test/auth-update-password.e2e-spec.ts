import { HttpStatus, INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import request from 'supertest';
import { App } from 'supertest/types';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AuthResponseDto } from '@/modules/auth/dto/auth-response.dto';
import { PrismaService } from '@/prisma/prisma.service';

import { AppModule } from '../src/app.module';

describe('Auth Update Password (e2e)', () => {
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
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  const validUserDto = { email: 'testemail@test.com', password: 'validPassword123' };

  const registerUser = async (): Promise<AuthResponseDto> => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .set('x-bff-secret', bffSecret)
      .send(validUserDto)
      .expect(HttpStatus.CREATED);
    return response.body as AuthResponseDto;
  };

  const updatePassword = async (
    token: string,
    body: { currentPassword?: string; newPassword?: string },
    expectedStatus = HttpStatus.OK,
  ) => {
    return request(app.getHttpServer())
      .patch(`/auth/update-password`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-bff-secret', bffSecret)
      .send(body)
      .expect(expectedStatus);
  };

  describe('Auth Service - /update-password (PATCH)', () => {
    describe('should validate input data', () => {
      it.each([
        {
          condition: 'missing currentPassword',
          body: { newPassword: 'validPassword456' },
        },
        {
          condition: 'missing newPassword',
          body: { currentPassword: 'validPassword123' },
        },
        {
          condition: 'short newPassword',
          body: { currentPassword: 'validPassword123', newPassword: 'short' },
        },
        {
          condition: 'unsafe newPassword',
          body: { currentPassword: 'validPassword123', newPassword: 'unsafepassword' },
        },
      ])('should return BAD_REQUEST(400) when $condition', async ({ body }) => {
        const { access_token } = await registerUser();
        const response = await updatePassword(access_token, body, HttpStatus.BAD_REQUEST);

        expect(response.body).toHaveProperty('message');
      });
    });

    it('should update password and return a new token pair - old token should be revoked', async () => {
      const { access_token, refresh_token } = await registerUser();
      const response = await updatePassword(access_token, {
        currentPassword: validUserDto.password,
        newPassword: 'newPassword123',
      });

      const body = response.body as AuthResponseDto;
      const expiresIn = configService.get<number>('AUTH_ACCESS_TOKEN_EXPIRATION_IN_SECONDS', 900);

      expect(body).toMatchObject({
        access_token: expect.any(String) as string,
        refresh_token: expect.any(String) as string,
        token_type: 'Bearer',
        expires_in: expiresIn,
      });

      expect(body.access_token).not.toBe(access_token);
      expect(body.refresh_token).not.toBe(refresh_token);

      await request(app.getHttpServer())
        .post('/auth/refresh-token')
        .set('Authorization', `Bearer ${refresh_token}`)
        .set('x-bff-secret', bffSecret)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should not update password with identical current and new password', async () => {
      const { access_token } = await registerUser();
      const body = { currentPassword: validUserDto.password, newPassword: validUserDto.password };
      const response = await updatePassword(access_token, body, HttpStatus.BAD_REQUEST);
      expect(response.body).toHaveProperty('message');
    });

    it('should not update password with incorrect current password', async () => {
      const { access_token } = await registerUser();
      const body = { currentPassword: 'IncorrectPassword123', newPassword: 'newPassword123' };
      const response = await updatePassword(access_token, body, HttpStatus.BAD_REQUEST);
      expect(response.body).toHaveProperty('message');
    });

    it('should not update password when user not found', async () => {
      const { access_token } = await registerUser();
      await prisma.user.delete({ where: { email: validUserDto.email } });
      const body = { currentPassword: 'currentPassword123', newPassword: 'newPassword123' };
      const response = await updatePassword(access_token, body, HttpStatus.NOT_FOUND);
      expect(response.body).toHaveProperty('message');
    });

    it('should allow login with updated password', async () => {
      const { access_token } = await registerUser();
      const body = { currentPassword: validUserDto.password, newPassword: 'newPassword123' };
      await updatePassword(access_token, body);
      await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-bff-secret', bffSecret)
        .send({ email: validUserDto.email, password: 'newPassword123' })
        .expect(HttpStatus.OK);
    });
  });
});
