import { Test, TestingModule } from '@nestjs/testing';

import { beforeEach, describe, expect, it } from 'vitest';

import { PrismaService } from '@/prisma/prisma.service';

import { RefreshTokenService } from './refresh-token.service';

describe('RefreshTokenService', () => {
  let service: RefreshTokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RefreshTokenService, { provide: PrismaService, useValue: {} }],
    }).compile();

    service = module.get<RefreshTokenService>(RefreshTokenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
