import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { DateFormat, Theme, TimeFormat, Units } from '@repo/constants';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CreatePreferencesDto } from './dto/create-preferences.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { Preference } from './schema/preferences.schema';
import { PreferencesService } from './preferences.service';
describe('PreferencesService', () => {
  let service: PreferencesService;

  const mockPreferenceModel = {
    findOneAndUpdate: vi.fn(),
    findOne: vi.fn(),
    findOneAndDelete: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PreferencesService,
        {
          provide: getModelToken(Preference.name),
          useValue: mockPreferenceModel,
        },
      ],
    }).compile();

    service = module.get<PreferencesService>(PreferencesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPreference', () => {
    it('should call findOneAndUpdate with upsert options and return the result', async () => {
      const userId = 'user-1';
      const dto: CreatePreferencesDto = {
        units: Units.METRIC,
        theme: Theme.LIGHT,
        dateFormat: DateFormat.DD_MM_YY_SLASH,
        timeFormat: TimeFormat.TWENTY_FOUR_HOUR,
      };
      const mockResult = { userId, ...dto };
      mockPreferenceModel.findOneAndUpdate.mockResolvedValue(mockResult);

      const result = await service.createPreference(dto, userId);

      expect(mockPreferenceModel.findOneAndUpdate).toHaveBeenCalledWith(
        { userId },
        { ...dto, userId },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
      );
      expect(result).toEqual(mockResult);
    });

    it('should upsert (overwrite) if preferences already exist for the user', async () => {
      const userId = 'user-1';
      const dto: CreatePreferencesDto = {
        units: Units.IMPERIAL,
        theme: Theme.DARK,
        dateFormat: DateFormat.MM_DD_YY_SLASH,
        timeFormat: TimeFormat.TWELVE_HOUR,
      };
      const mockResult = { userId, ...dto };
      mockPreferenceModel.findOneAndUpdate.mockResolvedValue(mockResult);

      const result = await service.createPreference(dto, userId);

      expect(mockPreferenceModel.findOneAndUpdate).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResult);
    });

    it('should pass partial DTO fields and still include userId', async () => {
      const userId = 'user-1';
      const dto = { units: 'metric' } as CreatePreferencesDto;
      const mockResult = { userId, units: 'metric' };
      mockPreferenceModel.findOneAndUpdate.mockResolvedValue(mockResult);

      await service.createPreference(dto, userId);

      expect(mockPreferenceModel.findOneAndUpdate).toHaveBeenCalledWith(
        { userId },
        { units: 'metric', userId },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
      );
    });
  });

  describe('getPreference', () => {
    it('should return preferences for a user', async () => {
      const userId = 'user-1';
      const mockResult = { userId, units: 'metric', theme: 'light' };
      mockPreferenceModel.findOne.mockResolvedValue(mockResult);

      const result = await service.getPreference(userId);

      expect(mockPreferenceModel.findOne).toHaveBeenCalledWith({ userId });
      expect(result).toEqual(mockResult);
    });

    it('should return null if no preferences exist for the user', async () => {
      const userId = 'user-1';
      mockPreferenceModel.findOne.mockResolvedValue(null);

      const result = await service.getPreference(userId);

      expect(mockPreferenceModel.findOne).toHaveBeenCalledWith({ userId });
      expect(result).toBeNull();
    });
  });

  describe('updatePreference', () => {
    it('should call findOneAndUpdate with returnDocument:after and return the updated result', async () => {
      const userId = 'user-1';
      const dto: UpdatePreferencesDto = { units: Units.IMPERIAL };
      const mockResult = { userId, units: 'imperial' };
      mockPreferenceModel.findOneAndUpdate.mockResolvedValue(mockResult);

      const result = await service.updatePreference(userId, dto);

      expect(mockPreferenceModel.findOneAndUpdate).toHaveBeenCalledWith(
        { userId },
        { $set: { userId, units: Units.IMPERIAL } },
        { returnDocument: 'after' },
      );
      expect(result).toEqual(mockResult);
    });

    it('should return null if preferences do not exist for the user', async () => {
      const userId = 'user-1';
      const dto: UpdatePreferencesDto = { theme: Theme.DARK };
      mockPreferenceModel.findOneAndUpdate.mockResolvedValue(null);

      const result = await service.updatePreference(userId, dto);

      expect(mockPreferenceModel.findOneAndUpdate).toHaveBeenCalledWith(
        { userId },
        { $set: { userId, theme: Theme.DARK } },
        { returnDocument: 'after' },
      );
      expect(result).toBeNull();
    });

    it('should add null fields to $unset', async () => {
      const userId = 'user-1';
      const dto: UpdatePreferencesDto = { theme: null };
      mockPreferenceModel.findOneAndUpdate.mockResolvedValue({ userId });

      await service.updatePreference(userId, dto);

      expect(mockPreferenceModel.findOneAndUpdate).toHaveBeenCalledWith(
        { userId },
        { $set: { userId }, $unset: { theme: 1 } },
        { returnDocument: 'after' },
      );
    });

    it('should separate null fields into $unset and non-null fields into $set', async () => {
      const userId = 'user-1';
      const dto: UpdatePreferencesDto = { units: Units.METRIC, theme: null };
      mockPreferenceModel.findOneAndUpdate.mockResolvedValue({ userId, units: 'metric' });

      await service.updatePreference(userId, dto);

      expect(mockPreferenceModel.findOneAndUpdate).toHaveBeenCalledWith(
        { userId },
        { $set: { userId, units: Units.METRIC }, $unset: { theme: 1 } },
        { returnDocument: 'after' },
      );
    });

    it('should spread all provided fields into the update payload', async () => {
      const userId = 'user-1';
      const dto: UpdatePreferencesDto = {
        units: Units.METRIC,
        theme: Theme.DARK,
        timeFormat: TimeFormat.TWELVE_HOUR,
      };
      mockPreferenceModel.findOneAndUpdate.mockResolvedValue({ userId, ...dto });

      await service.updatePreference(userId, dto);

      expect(mockPreferenceModel.findOneAndUpdate).toHaveBeenCalledWith(
        { userId },
        {
          $set: {
            userId,
            units: Units.METRIC,
            theme: Theme.DARK,
            timeFormat: TimeFormat.TWELVE_HOUR,
          },
        },
        { returnDocument: 'after' },
      );
    });
  });

  describe('deletePreference', () => {
    it('should return true when preferences exist and are deleted', async () => {
      const userId = 'user-1';
      mockPreferenceModel.findOneAndDelete.mockResolvedValue({ userId, units: 'metric' });

      const result = await service.deletePreference(userId);

      expect(mockPreferenceModel.findOneAndDelete).toHaveBeenCalledWith({ userId });
      expect(result).toBe(true);
    });

    it('should return false when preferences do not exist for the user', async () => {
      const userId = 'user-1';
      mockPreferenceModel.findOneAndDelete.mockResolvedValue(null);

      const result = await service.deletePreference(userId);

      expect(mockPreferenceModel.findOneAndDelete).toHaveBeenCalledWith({ userId });
      expect(result).toBe(false);
    });
  });
});
