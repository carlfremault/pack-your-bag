import { ConfigService } from '@nestjs/config';
import {
  DiskHealthIndicator,
  HealthCheckService,
  MemoryHealthIndicator,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { Test, TestingModule } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaService } from '@/prisma/prisma.service';

import { HealthController } from './health.controller';

const MOCK_CONFIG = {
  AUTH_STORAGE_PATH: '/',
} as const;

describe('HealthController', () => {
  let controller: HealthController;

  const mockConfigService = {
    get: vi.fn(<T = number>(key: string, defaultValue?: T): T => {
      return (MOCK_CONFIG[key as keyof typeof MOCK_CONFIG] ?? defaultValue) as T;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: {},
        },
        {
          provide: PrismaHealthIndicator,
          useValue: {},
        },
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: DiskHealthIndicator,
          useValue: {},
        },
        {
          provide: MemoryHealthIndicator,
          useValue: {},
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
