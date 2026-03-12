import { Test, TestingModule } from '@nestjs/testing';

import { BffGuard, CustomThrottlerGuard, JwtAuthGuard } from '@repo/nestjs-common';

import { beforeEach, describe, expect, it } from 'vitest';

import { PackController } from './pack.controller';
import { PackService } from './pack.service';

describe('PackController', () => {
  let controller: PackController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PackController],
      providers: [
        {
          provide: PackService,
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

    controller = module.get<PackController>(PackController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
