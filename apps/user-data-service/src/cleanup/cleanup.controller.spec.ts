import { Test, TestingModule } from '@nestjs/testing';

import { InternalGuard } from '@repo/nestjs-common';

import { beforeEach, describe, expect, it } from 'vitest';

import { CleanupController } from './cleanup.controller';
import { CleanupService } from './cleanup.service';

describe('CleanupController', () => {
  let controller: CleanupController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CleanupController],
      providers: [
        {
          provide: CleanupService,
          useValue: {},
        },
      ],
    })
      .overrideGuard(InternalGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CleanupController>(CleanupController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
