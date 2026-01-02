import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { Prisma } from '@prisma-client';
import bcrypt from 'bcrypt';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserService } from '../user/user.service';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockUserService = {
    createUser: vi.fn(),
  };

  const mockConfigService = {
    get: vi.fn((key: string, defaultValue: number) => {
      const config: { [key: string]: number } = {
        AUTH_BCRYPT_SALT_ROUNDS: 10,
        AUTH_DEFAULT_USER_ROLE_ID: 1,
      };
      return config[key] ?? defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('register should call userService.createUser with correctly prepared data', async () => {
    const userDto = { email: 'testemail@test.com', password: 'validPassword123' };

    mockUserService.createUser.mockResolvedValue({});
    await service.register(userDto);
    expect(mockUserService.createUser).toHaveBeenCalledTimes(1);

    const createUserArgs = mockUserService.createUser.mock.lastCall![0] as Prisma.UserCreateInput;
    expect(createUserArgs.id).toBeDefined();
    expect(createUserArgs.email).toBe(userDto.email);
    expect(createUserArgs.password).not.toBe(userDto.password);
    const isMatch = await bcrypt.compare(userDto.password, createUserArgs.password);
    expect(isMatch).toBe(true);
    expect(createUserArgs.role).toEqual({
      connect: { id: 1 },
    });
  });
});
