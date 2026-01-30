import { HttpStatus, INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import request from 'supertest';
import { App } from 'supertest/types';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AppModule } from '@/app.module';
import { AuthResponseDto } from '@/modules/auth/dto/auth-response.dto';
import { PrismaService } from '@/prisma/prisma.service';

describe('Auth login (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let configService: ConfigService;
  let accessTokenExpires: number;
  let bffSecret: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    configService = moduleFixture.get(ConfigService);

    accessTokenExpires = configService.get<number>('AUTH_ACCESS_TOKEN_EXPIRATION_IN_SECONDS', 2000);
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
  const validUserDtoWithUppercaseEmail = {
    email: 'TESTEMAIL@TEST.COM',
    password: 'validPassword123',
  };

  const registerUser = async () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .set('x-bff-secret', bffSecret)
      .send(validUserDto)
      .expect(HttpStatus.CREATED);
  };

  const loginUser = async (
    payload: {
      email?: string;
      password?: string;
    },
    expectedStatus = HttpStatus.OK,
  ) => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .set('x-bff-secret', bffSecret)
      .send(payload)
      .expect(expectedStatus);
  };

  describe('Auth Service - /login (POST)', () => {
    describe('should validate input data', () => {
      it.each([
        {
          condition: 'missing password',
          payload: { email: 'testemail@test.com' },
        },
        {
          condition: 'missing email',
          payload: { password: 'validPassword123' },
        },
        {
          condition: 'invalid email format',
          payload: { email: 'invalidemail', password: 'validPassword123' },
        },
      ])('should return BAD_REQUEST(400) when $condition', async ({ payload }) => {
        const response = await loginUser(payload, HttpStatus.BAD_REQUEST);
        expect(response.body).toMatchObject({
          error: 'Bad Request',
        });
      });
    });

    it('should log in existing user with correct credentials and return token pair', async () => {
      await registerUser();
      const response = await loginUser(validUserDto);
      const body = response.body as AuthResponseDto;

      expect(body).toMatchObject({
        access_token: expect.any(String) as string,
        refresh_token: expect.any(String) as string,
        token_type: 'Bearer',
        expires_in: accessTokenExpires,
      });
    });
    it('should log in existing user with correct credentials and different email casing', async () => {
      await registerUser();
      const response = await loginUser(validUserDtoWithUppercaseEmail);
      const body = response.body as AuthResponseDto;

      expect(body).toMatchObject({
        access_token: expect.any(String) as string,
        refresh_token: expect.any(String) as string,
        token_type: 'Bearer',
        expires_in: accessTokenExpires,
      });
    });

    it('should not login with incorrect password', async () => {
      await registerUser();
      const response = await loginUser(
        { email: validUserDto.email, password: 'IncorrectPassword123' },
        HttpStatus.UNAUTHORIZED,
      );
      expect(response.body).toMatchObject({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    });

    it('should not login non-existing user', async () => {
      const response = await loginUser(validUserDto, HttpStatus.UNAUTHORIZED);
      expect(response.body).toMatchObject({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    });
  });
});
