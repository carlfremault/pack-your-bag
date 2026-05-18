import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Preference } from '../preferences/schema/preferences.schema';

import { CleanupService } from './cleanup.service';

describe('CleanupService', () => {
  let service: CleanupService;

  const mockPreferenceModel = {
    deleteMany: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CleanupService,
        {
          provide: getModelToken(Preference.name),
          useValue: mockPreferenceModel,
        },
      ],
    }).compile();

    service = module.get<CleanupService>(CleanupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('deleteUserData', () => {
    const userIds = ['user-1', 'user-2'];

    it('should delete preferences for the given user IDs and return count', async () => {
      mockPreferenceModel.deleteMany.mockResolvedValue({ deletedCount: 2 });

      const result = await service.deleteUserData(userIds);

      expect(result).toEqual({ deletedPreferences: 2 });
      expect(mockPreferenceModel.deleteMany).toHaveBeenCalledWith({
        userId: { $in: userIds },
      });
    });

    it('should return zero when no preferences exist for the given user IDs', async () => {
      mockPreferenceModel.deleteMany.mockResolvedValue({ deletedCount: 0 });

      const result = await service.deleteUserData(userIds);

      expect(result).toEqual({ deletedPreferences: 0 });
    });
  });
});
