import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import request from 'supertest';
import { App } from 'supertest/types';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';

describe('HealthController (e2e)', () => {
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

  it('/health (GET) - status should be ok', async () => {
    const response = await request(app.getHttpServer()).get('/health');

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toMatchObject({
      status: 'ok',
      info: {
        database: { status: 'up' },
        storage: { status: 'up' },
        memory_heap: { status: 'up' },
      },
    });
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });
});
