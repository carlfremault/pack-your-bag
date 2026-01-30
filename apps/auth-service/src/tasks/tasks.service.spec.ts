import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuditLogProvider } from '@/modules/audit-log/audit-log.provider';
import { AuditLogService } from '@/modules/audit-log/audit-log.service';
import { RefreshTokenService } from '@/modules/refresh-token/refresh-token.service';
import { UserService } from '@/modules/user/user.service';

import { TasksService } from './tasks.service';

const MOCK_CONFIG = {
  AUTH_REFRESH_TOKEN_DB_RETENTION_DAYS: 14,
  AUDIT_LOG_INFO_RETENTION_DAYS: 30,
  AUDIT_LOG_ERROR_WARN_RETENTION_DAYS: 60,
  AUDIT_LOG_CRITICAL_RETENTION_DAYS: 90,
  AUTH_USER_DELETE_RETENTION_DAYS: 30,
} as const;

describe('TasksService', () => {
  let service: TasksService;

  const mockConfigService = {
    get: vi.fn(<T = number>(key: string, defaultValue?: T): T => {
      return (MOCK_CONFIG[key as keyof typeof MOCK_CONFIG] ?? defaultValue) as T;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: RefreshTokenService,
          useValue: {},
        },
        {
          provide: AuditLogService,
          useValue: {},
        },
        {
          provide: AuditLogProvider,
          useValue: {},
        },
        {
          provide: UserService,
          useValue: {},
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
