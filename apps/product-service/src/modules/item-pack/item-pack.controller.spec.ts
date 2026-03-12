import { Test, TestingModule } from '@nestjs/testing';

import { BffGuard, CustomThrottlerGuard, JwtAuthGuard } from '@repo/nestjs-common';

import { beforeEach, describe, expect, it } from 'vitest';

import { ItemPackController } from './item-pack.controller';
import { ItemPackService } from './item-pack.service';

describe('ItemPackController', () => {
  let controller: ItemPackController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItemPackController],
      providers: [
        {
          provide: ItemPackService,
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

    controller = module.get<ItemPackController>(ItemPackController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
