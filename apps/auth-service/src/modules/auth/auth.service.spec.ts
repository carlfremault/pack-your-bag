import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import bcrypt from 'bcrypt';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserService } from '../user/user.service';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;

  const mockUserService = {
    createUser: vi.fn().mockResolvedValue({ id: 'uuid-123', roleId: 1 }),
    getUser: vi.fn(),
  };

  const mockJwtService = {
    signAsync: vi.fn().mockResolvedValue('mock-jwt-token'),
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
        { provide: JwtService, useValue: mockJwtService },
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);

    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('register should call userService.createUser with correctly prepared data', async () => {
      const userDto = { email: 'testemail@test.com', password: 'validPassword123' };
      await service.register(userDto);

      expect(mockUserService.createUser).toHaveBeenCalledTimes(1);

      const mockedUserService = vi.mocked(userService);
      const lastCall = mockedUserService.createUser.mock.lastCall;
      expect(lastCall).toBeDefined();
      const createUserArgs = lastCall![0];

      expect(createUserArgs.id).toBeDefined();
      expect(createUserArgs.email).toBe(userDto.email);

      expect(createUserArgs.password).not.toBe(userDto.password);
      const isMatch = await bcrypt.compare(userDto.password, createUserArgs.password);
      expect(isMatch).toBe(true);

      expect(createUserArgs.role).toEqual({
        connect: { id: 1 },
      });
    });

    it('should transform email to lowercase before persistence', async () => {
      const userDto = { email: 'UPPER@domain.COM', password: 'validPassword123' };
      await service.register(userDto);
      const mockedUserService = vi.mocked(userService);
      const createUserArgs = mockedUserService.createUser.mock.lastCall![0];
      expect(createUserArgs.email).toBe('upper@domain.com');
    });
  });

  describe('login', () => {
    const userDto = { email: 'testemail@test.com', password: 'validPassword123' };
    const mockUser = {
      id: 'uuid-123',
      email: 'testemail@test.com',
      password: '',
      roleId: 1,
    };

    it('should return tokens for valid credentials', async () => {
      const hashedPassword = await bcrypt.hash(userDto.password, 10);
      mockUserService.getUser.mockResolvedValue({ ...mockUser, password: hashedPassword });

      const result = await service.login(userDto);
      expect(result.access_token).toBe('mock-jwt-token');
      expect(mockUserService.getUser).toHaveBeenCalledWith({ email: 'testemail@test.com' });
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUser.id,
          role: mockUser.roleId,
        }),
        expect.objectContaining({
          expiresIn: 3600,
        }),
      );
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      mockUserService.getUser.mockResolvedValue(null);
      await expect(service.login(userDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      const wrongHashedPassword = await bcrypt.hash('differentPassword', 10);
      mockUserService.getUser.mockResolvedValue({ ...mockUser, password: wrongHashedPassword });
      await expect(service.login(userDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should transform email to lowercase when looking up user', async () => {
      mockUserService.getUser.mockResolvedValue(null);
      const upperCaseDto = { email: 'TESTEMAIL@Test.Com', password: 'validPassword123' };

      await service.login(upperCaseDto).catch(() => {});
      expect(mockUserService.getUser).toHaveBeenCalledWith({ email: 'testemail@test.com' });
    });
  });
});
