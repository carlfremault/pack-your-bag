import { HttpStatus, INestApplication } from '@nestjs/common';

import { ListPack } from '@repo/db';

import request from 'supertest';
import { App } from 'supertest/types';

import { UpsertListInPackDto } from '@/modules/list-pack/dto/upsert-list-pack.dto';

export class ListPackHelpers {
  constructor(
    private readonly app: INestApplication<App>,
    private readonly bffSecret: string,
  ) {}

  async upsertListInPack(options: {
    payload: Partial<UpsertListInPackDto> | null;
    accessToken: string;
    expectedStatus?: number;
  }): Promise<{
    body: ListPack;
  }> {
    const { payload, accessToken, expectedStatus = HttpStatus.OK } = options;

    const req = request(this.app.getHttpServer())
      .post('/list-pack')
      .send(payload ?? undefined) // For testing invalid payloads
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-bff-secret', this.bffSecret);

    return req.expect(expectedStatus);
  }

  async removeListFromPack(options: {
    listId: string;
    packId: string;
    accessToken: string;
    expectedStatus?: number;
  }): Promise<{
    body: ListPack;
  }> {
    const { listId, packId, accessToken, expectedStatus = HttpStatus.NO_CONTENT } = options;

    const req = request(this.app.getHttpServer())
      .delete(`/list-pack/${listId}/${packId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-bff-secret', this.bffSecret);

    return req.expect(expectedStatus);
  }
}
