import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ServiceClientService } from './service-client.service';

const MOCK_CONFIG = {
  PRODUCT_SERVICE_URL: 'http://localhost:8002',
  USER_DATA_SERVICE_URL: 'http://localhost:8003',
  INTERNAL_SERVICE_SECRET: 'test-internal-secret',
};

describe('ServiceClientService', () => {
  let service: ServiceClientService;

  const mockConfigService = {
    getOrThrow: vi.fn((key: string) => {
      const value = MOCK_CONFIG[key as keyof typeof MOCK_CONFIG];
      if (!value) throw new Error(`Missing config: ${key}`);
      return value;
    }),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ServiceClientService, { provide: ConfigService, useValue: mockConfigService }],
    }).compile();

    service = module.get<ServiceClientService>(ServiceClientService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('cleanupProductData', () => {
    const userIds = ['user-1', 'user-2'];
    const mockResponse = {
      deletedItems: 5,
      deletedCategories: 2,
      deletedLists: 3,
      deletedPacks: 1,
      deletedTrips: 1,
    };

    it('should call product service cleanup endpoint and return result', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await service.cleanupProductData(userIds);

      expect(result).toEqual(mockResponse);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:8002/internal/cleanup/users',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-secret': 'test-internal-secret',
          },
          body: JSON.stringify({ userIds }),
        }),
      );
    });

    it('should throw on non-ok response', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      } as Response);

      await expect(service.cleanupProductData(userIds)).rejects.toThrow(
        'Internal request to http://localhost:8002/internal/cleanup/users failed with status 500',
      );
    });
  });

  describe('cleanupUserData', () => {
    const userIds = ['user-1'];
    const mockResponse = { deletedPreferences: 1 };

    it('should call user-data service cleanup endpoint and return result', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await service.cleanupUserData(userIds);

      expect(result).toEqual(mockResponse);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:8003/internal/cleanup/users',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-secret': 'test-internal-secret',
          },
          body: JSON.stringify({ userIds }),
        }),
      );
    });

    it('should throw on non-ok response', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 503,
        text: () => Promise.resolve('Service Unavailable'),
      } as Response);

      await expect(service.cleanupUserData(userIds)).rejects.toThrow(
        'Internal request to http://localhost:8003/internal/cleanup/users failed with status 503',
      );
    });
  });
});
