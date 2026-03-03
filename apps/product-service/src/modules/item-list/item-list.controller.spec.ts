import { Test, TestingModule } from '@nestjs/testing';

import { BffGuard, CustomThrottlerGuard, JwtAuthGuard } from '@repo/nestjs-common';

import { beforeEach, describe, expect, it } from 'vitest';

import { ItemListController } from './item-list.controller';
import { ItemListService } from './item-list.service';

describe('ItemListController', () => {
  let controller: ItemListController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItemListController],
      providers: [
        {
          provide: ItemListService,
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

    controller = module.get<ItemListController>(ItemListController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
