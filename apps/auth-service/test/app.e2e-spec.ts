import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import request from 'supertest';
import { App } from 'supertest/types';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AuthResponseDto } from '@/modules/auth/dto/auth-response.dto';
import { PrismaService } from '@/prisma/prisma.service';

import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let configService: ConfigService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    configService = moduleFixture.get(ConfigService);
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

    const body = response.body as AuthResponseDto;
    expect(body.access_token).toBeDefined();
    expect(body.token_type).toBe('Bearer');
    expect(body.expires_in).toBe(configService.get('AUTH_JWT_EXPIRATION') || 3600);
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

  it('/signin (POST) - should signin existing user with correct credentials', async () => {
    await request(app.getHttpServer()).post('/auth/register').send(validUserDto).expect(201);
    const response = await request(app.getHttpServer())
      .post('/auth/signin')
      .send(validUserDto)
      .expect(200);

    const body = response.body as AuthResponseDto;
    expect(body.access_token).toBeDefined();
    expect(body.token_type).toBe('Bearer');
    expect(body.expires_in).toBe(configService.get('AUTH_JWT_EXPIRATION') || 3600);
  });
  it('/signin (POST) - should signin existing user with correct credentials and different email casing', async () => {
    await request(app.getHttpServer()).post('/auth/register').send(validUserDto).expect(201);
    const response = await request(app.getHttpServer())
      .post('/auth/signin')
      .send(validUserDtoWithUppercaseEmail)
      .expect(200);

    const body = response.body as AuthResponseDto;
    expect(body.access_token).toBeDefined();
    expect(body.token_type).toBe('Bearer');
    expect(body.expires_in).toBe(configService.get('AUTH_JWT_EXPIRATION') || 3600);
  });

  it('/signin (POST) - should not signin with incorrect password', async () => {
    await request(app.getHttpServer()).post('/auth/register').send(validUserDto).expect(201);
    const response = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ email: validUserDto.email, password: 'IncorrectPassword123' })
      .expect(401);
    expect((response.body as { message: string }).message).toBeDefined();
  });

  it('/signin (POST) - should not signin non-existing user', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/signin')
      .send(validUserDto)
      .expect(401);
    expect((response.body as { message: string }).message).toBeDefined();
  });
});
