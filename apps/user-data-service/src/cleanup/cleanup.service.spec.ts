import { HttpStatus } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { AuditLogEventType, AuditLogSeverity } from '@repo/db';
import { AuditLogProvider } from '@repo/nestjs-common';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Preference } from '../preferences/schema/preferences.schema';

import { CleanupService } from './cleanup.service';

describe('CleanupService', () => {
  let service: CleanupService;

  const mockPreferenceModel = {
    deleteMany: vi.fn(),
  };

  const mockAuditLogProvider = { auditRequest: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CleanupService,
        {
          provide: getModelToken(Preference.name),
          useValue: mockPreferenceModel,
        },
        { provide: AuditLogProvider, useValue: mockAuditLogProvider },
      ],
    }).compile();

    service = module.get<CleanupService>(CleanupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('deleteUserData', () => {
    const userIds = ['user-1', 'user-2'];

    it('should delete preferences for the given user IDs and audit the result', async () => {
      mockPreferenceModel.deleteMany.mockResolvedValue({ deletedCount: 2 });

      await service.deleteUserData(userIds);

      expect(mockPreferenceModel.deleteMany).toHaveBeenCalledWith({
        userId: { $in: userIds },
      });
      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditLogEventType.SCHEDULED_TASK,
          severity: AuditLogSeverity.INFO,
          statusCode: HttpStatus.NO_CONTENT,
          message: expect.stringContaining('Deleted 2 preferences') as string,
        }),
      );
    });

    it('should audit zero count when no preferences exist for the given user IDs', async () => {
      mockPreferenceModel.deleteMany.mockResolvedValue({ deletedCount: 0 });

      await service.deleteUserData(userIds);

      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Deleted 0 preferences') as string,
        }),
      );
    });
  });
});
