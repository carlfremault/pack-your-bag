import { Test, TestingModule } from '@nestjs/testing';

import { beforeEach, describe, expect, it } from 'vitest';

import { AuditLogProvider } from '@/modules/audit-log/audit-log.provider';
import { RefreshTokenService } from '@/modules/refresh-token/refresh-token.service';

import { TasksService } from './tasks.service';

describe('TasksService', () => {
  let service: TasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: RefreshTokenService,
          useValue: {},
        },
        {
          provide: AuditLogProvider,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
