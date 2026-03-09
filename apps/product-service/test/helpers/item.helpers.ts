import { HttpStatus, INestApplication } from '@nestjs/common';

import request from 'supertest';
import { App } from 'supertest/types';

import { ItemResponseDto } from '@/common/dto/item-response.dto';
import { CreateItemDto } from '@/modules/item/dto/create-item.dto';

export class ItemHelpers {
  constructor(
    private readonly app: INestApplication<App>,
    private readonly bffSecret: string,
  ) {}

  async createItem(options: {
    payload: Partial<CreateItemDto> | null;
    accessToken: string;
    expectedStatus?: number;
  }): Promise<{
    body: ItemResponseDto;
  }> {
    const { payload, accessToken, expectedStatus = HttpStatus.CREATED } = options;

    const req = request(this.app.getHttpServer())
      .post('/item')
      .send(payload ?? undefined) // For testing invalid payloads
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-bff-secret', this.bffSecret);

    return req.expect(expectedStatus);
  }
}
