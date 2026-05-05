import { HttpStatus, INestApplication } from '@nestjs/common';

import { ItemPack } from '@repo/db';

import request from 'supertest';
import { App } from 'supertest/types';

import { UpsertItemInPackDto } from '@/modules/item-pack/dto/upsert-item-pack.dto';

export class ItemPackHelpers {
  constructor(
    private readonly app: INestApplication<App>,
    private readonly bffSecret: string,
  ) {}

  async upsertItemPack(options: {
    payload: Partial<UpsertItemInPackDto> | null;
    accessToken: string;
    expectedStatus?: number;
  }): Promise<{
    body: ItemPack;
  }> {
    const { payload, accessToken, expectedStatus = HttpStatus.OK } = options;

    const req = request(this.app.getHttpServer())
      .post('/item-pack')
      .send(payload ?? undefined) // For testing invalid payloads
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-bff-secret', this.bffSecret);

    return req.expect(expectedStatus);
  }

  async removeItemFromPack(options: {
    itemId: string;
    packId: string;
    accessToken: string;
    expectedStatus?: number;
  }): Promise<{
    body: ItemPack;
  }> {
    const { itemId, packId, accessToken, expectedStatus = HttpStatus.NO_CONTENT } = options;

    const req = request(this.app.getHttpServer())
      .delete(`/item-pack/${itemId}/${packId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-bff-secret', this.bffSecret);

    return req.expect(expectedStatus);
  }
}
