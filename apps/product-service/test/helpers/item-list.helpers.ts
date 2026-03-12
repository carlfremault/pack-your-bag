import { HttpStatus, INestApplication } from '@nestjs/common';

import { ItemList } from '@repo/db';

import request from 'supertest';
import { App } from 'supertest/types';

import { UpsertItemOnListDto } from '@/modules/item-list/dto/upsert-item-list.dto';

export class ItemListHelpers {
  constructor(
    private readonly app: INestApplication<App>,
    private readonly bffSecret: string,
  ) {}

  async upsertItemOnList(options: {
    payload: Partial<UpsertItemOnListDto> | null;
    accessToken: string;
    expectedStatus?: number;
  }): Promise<{
    body: ItemList;
  }> {
    const { payload, accessToken, expectedStatus = HttpStatus.OK } = options;

    const req = request(this.app.getHttpServer())
      .post('/item-list')
      .send(payload ?? undefined) // For testing invalid payloads
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-bff-secret', this.bffSecret);

    return req.expect(expectedStatus);
  }

  async removeItemFromList(options: {
    itemId: string;
    listId: string;
    accessToken: string;
    expectedStatus?: number;
  }): Promise<{
    body: ItemList;
  }> {
    const { itemId, listId, accessToken, expectedStatus = HttpStatus.OK } = options;

    const req = request(this.app.getHttpServer())
      .delete(`/item-list/${itemId}/${listId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-bff-secret', this.bffSecret);

    return req.expect(expectedStatus);
  }
}
