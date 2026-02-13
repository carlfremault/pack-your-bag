import { Test, TestingModule } from '@nestjs/testing';

import { beforeEach, describe, expect, it } from 'vitest';

import { PrismaService } from '@/prisma/prisma.service';

import { VerificationTokenService } from './verification-token.service';

describe('VerificationTokenService', () => {
  let service: VerificationTokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerificationTokenService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<VerificationTokenService>(VerificationTokenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
