import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';

import { AuditEventType, Prisma, TokenType } from '@prisma-client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { v7 as uuidv7 } from 'uuid';

import { AUTH_DEFAULT_USER_ROLE_ID } from '@/common/constants/auth.constants';
import { InvalidTokenException } from '@/common/exceptions/bad-request.exceptions';
import {
  InvalidSessionException,
  SessionExpiredException,
} from '@/common/exceptions/unauthorized.exceptions';
import { DeletedUserHelper } from '@/common/helpers/deleted-user.helper';
import { RefreshTokenUser } from '@/common/interfaces/refresh-token-user.interface';
import { AuthCredentialsDto } from '@/modules/auth/dto/auth-credentials';
import { RefreshTokenService } from '@/modules/refresh-token/refresh-token.service';
import { UpdatePasswordDto } from '@/modules/user/dto/update-password.dto';
import { UserService } from '@/modules/user/user.service';
import { VerificationTokenService } from '@/modules/verification-token/verification-token.service';

import { AuthForgotPasswordDto } from './dto/auth-forgot-password';
import { AuthResetPasswordDto } from './dto/auth-reset-password';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name, { timestamp: true });
  private readonly bcryptSaltRounds: number;
  private readonly defaultUserRoleId: number;
  private readonly dummyHash: string;
  private readonly deletedUserRetentionDays: number;
  private readonly accessTokenExpiresIn: number;
  private readonly refreshTokenExpiresIn: number;
  private readonly passwordResetTokenExpiresInMS: number;
  private readonly frontendUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly verificationTokenService: VerificationTokenService,
    private readonly userService: UserService,
    private readonly mailerService: MailerService,
  ) {
    this.bcryptSaltRounds = this.configService.getOrThrow<number>('AUTH_BCRYPT_SALT_ROUNDS');
    this.defaultUserRoleId = AUTH_DEFAULT_USER_ROLE_ID;
    this.dummyHash = bcrypt.hashSync('dummy_password_for_timing', this.bcryptSaltRounds);
    this.deletedUserRetentionDays = this.configService.getOrThrow<number>(
      'AUTH_USER_DELETE_RETENTION_DAYS',
    );
    this.accessTokenExpiresIn = this.configService.getOrThrow<number>(
      'AUTH_ACCESS_TOKEN_EXPIRATION_IN_SECONDS',
    );
    this.refreshTokenExpiresIn = this.configService.getOrThrow<number>(
      'AUTH_REFRESH_TOKEN_EXPIRATION_IN_SECONDS',
    );
    this.passwordResetTokenExpiresInMS = this.configService.getOrThrow<number>(
      'AUTH_PASSWORD_RESET_TOKEN_EXPIRATION_IN_MS',
    );
    this.frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
  }

  async register(body: AuthCredentialsDto): Promise<AuthResponseDto> {
    const { email, password } = body;

    const uuid = uuidv7();
    const hashedPassword = await bcrypt.hash(password, this.bcryptSaltRounds);

    const data: Prisma.UserCreateInput = {
      id: uuid,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: {
        connect: { id: this.defaultUserRoleId },
      },
    };

    const newUser = await this.userService.createUser(data);
    return this.issueRefreshToken(newUser.id, newUser.roleId);
  }

  async login(body: AuthCredentialsDto): Promise<AuthResponseDto> {
    const { email, password } = body;

    const user = await this.userService.getUser({ email: email.toLowerCase() });
    // Perform comparison even if user doesn't exist to prevent timing attacks
    const passwordToCompare = user?.password || this.dummyHash;
    const isPasswordValid = await bcrypt.compare(password, passwordToCompare);

    if (!user || !isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    DeletedUserHelper.checkDeletedUser(user, this.deletedUserRetentionDays);

    return this.issueRefreshToken(user.id, user.roleId);
  }

  async refreshToken(refreshTokenUser: RefreshTokenUser): Promise<AuthResponseDto> {
    const { userId, tokenId, tokenFamilyId } = refreshTokenUser;
    const user = await this.userService.getUser({ id: userId, isDeleted: false });
    if (!user) {
      throw new UnauthorizedException('Access Denied');
    }

    const storedToken = await this.refreshTokenService.getRefreshToken({ id: tokenId });
    if (!storedToken) {
      this.logger.warn('Token not found in DB', { userId, tokenId });
      throw new InvalidSessionException('Token not found in DB');
    }

    if (storedToken.family !== tokenFamilyId || storedToken.userId !== userId) {
      this.logger.error('Token ownership/family mismatch', {
        expectedUserId: userId,
        actualUserId: storedToken.userId,
        expectedFamily: tokenFamilyId,
        actualFamily: storedToken.family,
      });
      throw new InvalidSessionException('Token ownership/family mismatch');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new SessionExpiredException('Refresh token expired in DB');
    }

    if (storedToken.isRevoked) {
      const newerValidToken = await this.refreshTokenService.handleRevokedTokenRequest(
        userId,
        storedToken,
      );
      return this.generateJwtResponse(
        userId,
        user.roleId,
        newerValidToken.id,
        newerValidToken.family,
        AuditEventType.TOKEN_REFRESHED_RACE_CONDITION,
      );
    }

    return this.issueRefreshToken(user.id, user.roleId, tokenId, tokenFamilyId);
  }

  async logout(user: RefreshTokenUser): Promise<void> {
    const { userId, tokenFamilyId } = user;
    await this.refreshTokenService.revokeManyTokens({
      userId,
      family: tokenFamilyId,
    });
  }

  async logoutAllDevices(userId: string): Promise<void> {
    await this.refreshTokenService.revokeManyTokens({
      userId,
    });
  }

  async updatePasswordAndReauthenticate(
    userId: string,
    body: UpdatePasswordDto,
  ): Promise<AuthResponseDto> {
    const user = await this.userService.updatePassword(userId, body);
    return this.issueRefreshToken(user.id, user.roleId);
  }

  async forgotPassword(body: AuthForgotPasswordDto): Promise<void> {
    const { email } = body;
    const user = await this.userService.getUser({ email: email.toLowerCase(), isDeleted: false });

    if (!user) {
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + this.passwordResetTokenExpiresInMS);

    await this.verificationTokenService.upsertVerificationToken(
      {
        userId_type: {
          userId: user.id,
          type: TokenType.PASSWORD_RESET,
        },
      },
      {
        token: hashedResetToken,
        expiresAt,
        used: false,
      },
      {
        id: uuidv7(),
        token: hashedResetToken,
        type: TokenType.PASSWORD_RESET,
        user: { connect: { id: user.id } },
        expiresAt,
      },
    );

    const resetLink = `${this.frontendUrl}/reset-password?token=${resetToken}`;

    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Password Reset Request',
        text: `Reset your password here: ${resetLink}`,
        html: `<p>Click here to reset your password: <a href="${resetLink}">Reset Link</a></p>`,
      });
    } catch (error) {
      this.logger.error('Failed to send password reset request email', {
        userId: user.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return;
  }

  async resetPassword(body: AuthResetPasswordDto): Promise<void> {
    const { token, password } = body;
    const hash = crypto.createHash('sha256').update(token).digest('hex');

    const resetRecord = await this.verificationTokenService.getVerificationToken({
      where: {
        token: hash,
        type: TokenType.PASSWORD_RESET,
        used: false,
      },
    });

    if (!resetRecord || resetRecord.expiresAt < new Date()) {
      throw new InvalidTokenException();
    }

    const user = await this.userService.getUser({ id: resetRecord.userId });
    if (!user || user.isDeleted) {
      throw new InvalidTokenException();
    }

    await this.userService.resetPasswordWithToken(resetRecord.id, resetRecord.userId, password);

    const resetTime = new Date().toLocaleString();

    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Password Reset Confirmation',
        text: `Your password was successfully reset on ${resetTime}. If you did not make this change, please contact support immediately.`,
        html: `
        <p>Your password was successfully reset on ${resetTime}.</p>
        <p><strong>If you did not make this change, please contact support immediately.</strong></p>
      `,
      });
    } catch (error) {
      this.logger.error('Failed to send password reset confirmation email', {
        userId: user.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Helper functions
  private async issueRefreshToken(
    userId: string,
    roleId: number,
    existingTokenId?: string,
    existingTokenFamilyId?: string,
  ): Promise<AuthResponseDto> {
    if (
      (existingTokenId && !existingTokenFamilyId) ||
      (!existingTokenId && existingTokenFamilyId)
    ) {
      throw new InternalServerErrorException('Invalid refresh token rotation parameters');
    }

    const tokenFamilyId = existingTokenFamilyId ?? uuidv7();
    const newTokenId = uuidv7();
    const expiresAt = new Date(Date.now() + this.refreshTokenExpiresIn * 1000);

    const refreshTokenData = {
      id: newTokenId,
      family: tokenFamilyId,
      isRevoked: false,
      revokedAt: null,
      expiresAt,
      user: { connect: { id: userId } },
    };

    try {
      if (existingTokenFamilyId && existingTokenId) {
        await this.refreshTokenService.rotateRefreshToken(existingTokenId, refreshTokenData);
      } else {
        await this.refreshTokenService.createRefreshToken(refreshTokenData);
      }
    } catch (error) {
      this.logger.error('Database persistence failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new InternalServerErrorException('Session creation failed');
    }

    return this.generateJwtResponse(userId, roleId, newTokenId, tokenFamilyId);
  }

  private async generateJwtResponse(
    userId: string,
    roleId: number,
    tokenId: string,
    tokenFamilyId: string,
    auditOverride?: AuditEventType,
  ): Promise<AuthResponseDto> {
    const payload = {
      sub: userId,
      role: roleId,
      iat: Math.floor(Date.now() / 1000),
      jti: uuidv7(),
      type: 'access',
    };

    const refreshPayload = {
      ...payload,
      jti: tokenId,
      type: 'refresh',
      family: tokenFamilyId,
    };

    try {
      const [accessToken, refreshToken] = await Promise.all([
        this.jwtService.signAsync(payload),
        this.jwtService.signAsync(refreshPayload, { expiresIn: this.refreshTokenExpiresIn }),
      ]);

      return {
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'Bearer',
        expires_in: this.accessTokenExpiresIn,
        user: { id: userId, role: roleId },
        ...(auditOverride && { auditOverride }),
      };
    } catch (error) {
      this.logger.error('JWT Signing Failed:', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new InternalServerErrorException('Could not generate JWT tokens');
    }
  }
}
