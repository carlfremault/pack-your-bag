import { Test, TestingModule } from '@nestjs/testing';

import { BffGuard, CustomThrottlerGuard, JwtAuthGuard } from '@repo/nestjs-common';

import { beforeEach, describe, expect, it } from 'vitest';

import { ListPackController } from './list-pack.controller';
import { ListPackService } from './list-pack.service';

describe('ListPackController', () => {
  let controller: ListPackController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ListPackController],
      providers: [
        {
          provide: ListPackService,
          useValue: {},
        },
      ],
    })
      .overrideGuard(BffGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(CustomThrottlerGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ListPackController>(ListPackController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
