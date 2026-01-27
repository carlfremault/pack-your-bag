import { HttpStatus, INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import request from 'supertest';
import { App } from 'supertest/types';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AuthResponseDto } from '@/modules/auth/dto/auth-response.dto';
import { PrismaService } from '@/prisma/prisma.service';

import { AppModule } from '../src/app.module';

describe('Auth Register (e2e)', () => {
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
  const validUserDtoWithUppercaseEmail = {
    email: 'TESTEMAIL@TEST.COM',
    password: 'validPassword123',
  };

  const registerUser = async (
    payload: { email?: string; password?: string },
    expectedStatus = HttpStatus.CREATED,
  ) => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .set('x-bff-secret', bffSecret)
      .send(payload)
      .expect(expectedStatus);
  };

  describe('Auth Service - /register (POST)', () => {
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
          condition: 'short password',
          payload: { email: 'testemail@test.com', password: 'short' },
        },
        {
          condition: 'unsafe password',
          payload: { email: 'testemail@test.com', password: 'unsafepassword' },
        },
        {
          condition: 'invalid email format',
          payload: { email: 'invalidemail', password: 'validPassword123' },
        },
      ])('should return HttpStatus.BAD_REQUEST(400) when $condition', async ({ payload }) => {
        const response = await registerUser(payload, HttpStatus.BAD_REQUEST);
        expect(response.body).toMatchObject({
          error: 'Bad Request',
        });
      });
    });

    it('should register a new user and return a pair of tokens', async () => {
      const response = await registerUser(validUserDto);
      const body = response.body as AuthResponseDto;

      expect(body).toMatchObject({
        access_token: expect.any(String) as string,
        refresh_token: expect.any(String) as string,
        token_type: 'Bearer',
        expires_in: configService.get<number>('AUTH_ACCESS_TOKEN_EXPIRATION_IN_SECONDS', 900),
      });
    });

    it('should not accept a duplicate email', async () => {
      await registerUser(validUserDto);
      const response = await registerUser(validUserDto, HttpStatus.CONFLICT);
      expect(response.body).toMatchObject({
        error: 'Conflict',
        message: 'Email already exists.',
      });
    });

    it('should not accept a duplicate email with different casing', async () => {
      await registerUser(validUserDto);
      const response = await registerUser(validUserDtoWithUppercaseEmail, HttpStatus.CONFLICT);
      expect(response.body).toMatchObject({
        error: 'Conflict',
        message: 'Email already exists.',
      });
    });
  });
});
