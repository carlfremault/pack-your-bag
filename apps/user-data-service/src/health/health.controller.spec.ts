import { ConfigService } from '@nestjs/config';
import {
  DiskHealthIndicator,
  HealthCheckService,
  MemoryHealthIndicator,
  MongooseHealthIndicator,
} from '@nestjs/terminus';
import { Test, TestingModule } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HealthController } from './health.controller';

const MOCK_CONFIG = {
  USER_DATA_HEALTH_DISK_PATH: '/',
} as const;

describe('HealthController', () => {
  let controller: HealthController;

  const mockConfigService = {
    get: vi.fn((key: string, defaultValue?: string): string => {
      return (MOCK_CONFIG[key as keyof typeof MOCK_CONFIG] ?? defaultValue) as string;
    }),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: {},
        },
        {
          provide: MongooseHealthIndicator,
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
