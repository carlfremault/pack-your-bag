import { HttpStatus, INestApplication } from '@nestjs/common';

import request from 'supertest';
import { App } from 'supertest/types';

import { CreatePackDto } from '@/modules/pack/dto/create-pack.dto';
import { PackResponseDto } from '@/modules/pack/dto/pack-response.dto';

export class PackHelpers {
  constructor(
    private readonly app: INestApplication<App>,
    private readonly bffSecret: string,
  ) {}

  get defaultPackDto() {
    return {
      name: 'Test Pack',
      description: 'Test Description',
      colorCode: '#000000',
    };
  }

  async createPack(options: {
    payload: Partial<CreatePackDto> | null;
    accessToken: string;
    expectedStatus?: number;
  }): Promise<{
    body: PackResponseDto;
  }> {
    const { payload, accessToken, expectedStatus = HttpStatus.CREATED } = options;

    const req = request(this.app.getHttpServer())
      .post('/pack')
      .send(payload ?? undefined) // For testing invalid payloads
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-bff-secret', this.bffSecret);

    return req.expect(expectedStatus);
  }
}
