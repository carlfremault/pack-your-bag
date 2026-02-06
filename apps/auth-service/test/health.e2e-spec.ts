import { HttpStatus } from '@nestjs/common';

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createIntegrationContext, IntegrationTestContext } from './helpers/setup.helpers';

describe('HealthController (e2e)', () => {
  let ctx: IntegrationTestContext;

  beforeAll(async () => {
    ctx = await createIntegrationContext();
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('/health (GET) - status should be ok', async () => {
    const response = await request(ctx.app.getHttpServer()).get('/health');

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
});
