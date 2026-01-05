import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import request from 'supertest';
import { App } from 'supertest/types';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { UserEntity } from '@/modules/user/dtos/userEntity.dto';
import { PrismaService } from '@/prisma/prisma.service';

import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    try {
      await prisma.user.deleteMany();
    } finally {
      await app.close();
    }
  });

  const validUserDto = { email: 'testemail@test.com', password: 'validPassword123' };
  const validUserDtoWithUppercaseEmail = {
    email: 'TESTEMAIL@TEST.COM',
    password: 'validPassword123',
  };
  const userDtoWithoutPassword = { email: 'testemail@test.com' };
  const userDtoWithoutEmail = { password: 'validPassword123' };
  const userDtoWithShortPassword = { email: 'testemail@test.com', password: 'short' };
  const userDtoWithUnsafePassword = { email: 'testemail@test.com', password: 'unsafepassword' };
  const userDtoWithInvalidEmail = { email: 'invalidemail', password: 'validPassword123' };

  describe('/register (POST) - should validate input data', () => {
    it.each([
      {
        condition: 'missing password',
        payload: userDtoWithoutPassword,
      },
      {
        condition: 'missing email',
        payload: userDtoWithoutEmail,
      },
      {
        condition: 'short password',
        payload: userDtoWithShortPassword,
      },
      {
        condition: 'unsafe password',
        payload: userDtoWithUnsafePassword,
      },
      {
        condition: 'invalid email format',
        payload: userDtoWithInvalidEmail,
      },
    ])('should return 400 when $condition', async ({ payload }) => {
      await request(app.getHttpServer()).post('/auth/register').send(payload).expect(400);
    });
  });

  it('/register (POST) - should register a new user and return it without password', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(validUserDto)
      .expect(201);

    const body = response.body as UserEntity;
    expect(body.email).toBe(validUserDto.email);
    expect(body.id).toBeDefined();
    expect(body).not.toHaveProperty('password');
  });

  it('/register (POST) - should not accept a duplicate email', async () => {
    await request(app.getHttpServer()).post('/auth/register').send(validUserDto).expect(201);
    await request(app.getHttpServer()).post('/auth/register').send(validUserDto).expect(409);
  });

  it('/register (POST) - should not accept a duplicate email with different casing', async () => {
    await request(app.getHttpServer()).post('/auth/register').send(validUserDto).expect(201);
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(validUserDtoWithUppercaseEmail)
      .expect(409);
  });
});
