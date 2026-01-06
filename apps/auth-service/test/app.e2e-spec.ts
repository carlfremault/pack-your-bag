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

  describe('/register (POST) - should validate input data', () => {
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
    ])('should return 400 when $condition', async ({ payload }) => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(payload)
        .expect(400);
      expect((response.body as { message: string }).message).toBeDefined();
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
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(validUserDto)
      .expect(409);
    expect((response.body as { message: string }).message).toBeDefined();
  });

  it('/register (POST) - should not accept a duplicate email with different casing', async () => {
    await request(app.getHttpServer()).post('/auth/register').send(validUserDto).expect(201);
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(validUserDtoWithUppercaseEmail)
      .expect(409);
    expect((response.body as { message: string }).message).toBeDefined();
  });
});
