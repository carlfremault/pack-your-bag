import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import bcrypt from 'bcrypt';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { RefreshTokenService } from '../refresh-token/refresh-token.service';
import { UserService } from '../user/user.service';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let hashedPassword: string;
  const MOCK_ACCESS_EXPIRATION = 1234;
  const MOCK_REFRESH_EXPIRATION = 4321;
  const MOCK_SALT_ROUNDS = 4;

  const mockUserService = {
    createUser: vi.fn(),
    getUser: vi.fn(),
  };

  const mockJwtService = {
    signAsync: vi.fn().mockResolvedValue('mock-jwt-token'),
  };

  const mockRefreshTokenService = {
    createRefreshToken: vi.fn(),
  };

  const mockConfigService = {
    get: vi.fn((key: string, defaultValue: number) => {
      const config: { [key: string]: number } = {
        AUTH_BCRYPT_SALT_ROUNDS: MOCK_SALT_ROUNDS,
        AUTH_DEFAULT_USER_ROLE_ID: 1,
        AUTH_ACCESS_TOKEN_EXPIRATION_IN_SECONDS: MOCK_ACCESS_EXPIRATION,
        AUTH_REFRESH_TOKEN_EXPIRATION_IN_SECONDS: MOCK_REFRESH_EXPIRATION,
      };
      return config[key] ?? defaultValue;
    }),
  };

  beforeAll(async () => {
    hashedPassword = await bcrypt.hash(
      'validPassword123',
      mockConfigService.get('AUTH_BCRYPT_SALT_ROUNDS', MOCK_SALT_ROUNDS),
    );
  });

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: RefreshTokenService, useValue: mockRefreshTokenService },
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should create a user with normalized data and return a token pair', async () => {
      const userDto = { email: 'TESTEMAIL@test.com', password: 'validPassword123' };
      const mockUser = { id: 'uuid-123', roleId: 1 };
      mockUserService.createUser.mockResolvedValue(mockUser);

      const result = await service.register(userDto);

      expect(mockUserService.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String) as string,
          email: userDto.email.toLowerCase(),
          password: expect.toSatisfy((hash: string) =>
            bcrypt.compareSync(userDto.password, hash),
          ) as string,
          role: {
            connect: { id: 1 },
          },
        }),
      );

      expect(mockRefreshTokenService.createRefreshToken).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String) as string,
          family: expect.any(String) as string,
          isRevoked: false,
          revokedAt: null,
          expiresAt: expect.any(Date) as Date,
          user: { connect: { id: mockUser.id } },
        }),
      );

      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUser.id,
          role: mockUser.roleId,
          iat: expect.any(Number) as number,
        }),
      );

      expect(result).toEqual({
        access_token: 'mock-jwt-token',
        refresh_token: 'mock-jwt-token',
        token_type: 'Bearer',
        expires_in: mockConfigService.get(
          'AUTH_ACCESS_TOKEN_EXPIRATION_IN_SECONDS',
          MOCK_ACCESS_EXPIRATION,
        ),
        user: { id: mockUser.id, role: mockUser.roleId },
      });
    });
  });

  describe('login', () => {
    const userDto = { email: 'testemail@test.com', password: 'validPassword123' };
    const mockUser = { id: 'uuid-123', roleId: 1 };

    it('should return tokens for valid credentials', async () => {
      mockUserService.getUser.mockResolvedValue({ ...mockUser, password: hashedPassword });

      const result = await service.login(userDto);

      expect(mockUserService.getUser).toHaveBeenCalledWith({ email: 'testemail@test.com' });

      expect(mockRefreshTokenService.createRefreshToken).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String) as string,
          family: expect.any(String) as string,
          isRevoked: false,
          revokedAt: null,
          expiresAt: expect.any(Date) as Date,
          user: { connect: { id: mockUser.id } },
        }),
      );

      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUser.id,
          role: mockUser.roleId,
          iat: expect.any(Number) as number,
        }),
      );
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUser.id,
          jti: expect.any(String) as string,
          family: expect.any(String) as string,
        }),
        expect.objectContaining({
          expiresIn: mockConfigService.get(
            'AUTH_REFRESH_TOKEN_EXPIRATION_IN_SECONDS',
            MOCK_REFRESH_EXPIRATION,
          ),
        }),
      );

      expect(result).toEqual({
        access_token: 'mock-jwt-token',
        refresh_token: 'mock-jwt-token',
        token_type: 'Bearer',
        expires_in: mockConfigService.get(
          'AUTH_ACCESS_TOKEN_EXPIRATION_IN_SECONDS',
          MOCK_ACCESS_EXPIRATION,
        ),
        user: { id: mockUser.id, role: mockUser.roleId },
      });
    });

    it('should throw UnauthorizedException if user is not found and prevent timing attacks by calling bcrypt.compare with dummy hash', async () => {
      mockUserService.getUser.mockResolvedValue(null);
      const compareSpy = vi.spyOn(bcrypt, 'compare');

      await expect(service.login(userDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(userDto)).rejects.toThrow('Invalid email or password');

      expect(compareSpy).toHaveBeenCalledWith(
        userDto.password,
        expect.stringMatching(/^\$2[ayb]\$.{56}$/),
      );

      compareSpy.mockRestore();
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      const wrongHashedPassword = await bcrypt.hash('differentPassword', 10);
      mockUserService.getUser.mockResolvedValue({ ...mockUser, password: wrongHashedPassword });

      await expect(service.login(userDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should transform email to lowercase when looking up user', async () => {
      mockUserService.getUser.mockResolvedValue(null);
      const upperCaseDto = { email: 'TESTEMAIL@Test.Com', password: 'validPassword123' };

      await expect(service.login(upperCaseDto)).rejects.toThrow(UnauthorizedException);
      expect(mockUserService.getUser).toHaveBeenCalledWith({ email: 'testemail@test.com' });
    });
  });
});
