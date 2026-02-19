import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import type { Request } from 'express';

import { THROTTLE_LIMITS, THROTTLE_TTL_MS } from '@/common/constants/auth.constants';
import {
  ApiBffAndAccessSecurity,
  ApiBffAndRefreshSecurity,
  ApiBffSecurity,
} from '@/common/decorators/api-security.decorator';
import { AuditLog } from '@/common/decorators/audit-log.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { BffGuard } from '@/common/guards/bff.guard';
import { CustomThrottlerGuard } from '@/common/guards/custom-throttler.guard';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { JwtRefreshGuard } from '@/common/guards/jwt-refresh.guard';
import { Serialize } from '@/common/interceptors/serialize.interceptor';
import type { RefreshTokenUser } from '@/common/interfaces/refresh-token-user.interface';
import { AuditEventType } from '@/generated/prisma';
import { AuthCredentialsDto } from '@/modules/auth/dto/auth-credentials.dto';
import { UpdatePasswordDto } from '@/modules/user/dto/update-password.dto';

import { AuthForgotPasswordDto } from './dto/auth-forgot-password.dto';
import { AuthResetPasswordDto } from './dto/auth-reset-password.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { AuthService } from './auth.service';

@ApiTags('auth')
@ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Missing or invalid BFF secret.' })
@ApiResponse({ status: HttpStatus.TOO_MANY_REQUESTS, description: 'Rate limit exceeded.' })
@Controller('auth')
@UseGuards(BffGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiBffSecurity()
  @ApiOperation({ summary: 'Register a new user and issue tokens' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: AuthResponseDto,
    description: 'User registered.',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Validation failed.' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Email already in use.' })
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.REGISTER, ttl: THROTTLE_TTL_MS } })
  @Serialize(AuthResponseDto)
  @AuditLog(AuditEventType.USER_REGISTERED)
  async register(@Body() body: AuthCredentialsDto) {
    return this.authService.register(body);
  }

  @Post('login')
  @ApiBffSecurity()
  @ApiOperation({ summary: 'Authenticate a user and issue tokens' })
  @ApiResponse({ status: HttpStatus.OK, type: AuthResponseDto, description: 'User logged in.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Validation failed.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid email or password.' })
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.LOGIN, ttl: THROTTLE_TTL_MS } })
  @HttpCode(HttpStatus.OK)
  @Serialize(AuthResponseDto)
  @AuditLog(AuditEventType.USER_LOGIN_SUCCESS)
  async login(@Body() body: AuthCredentialsDto) {
    return this.authService.login(body);
  }

  @Post('refresh-token')
  @ApiBffAndRefreshSecurity()
  @ApiOperation({ summary: 'Rotate refresh token and issue new access token' })
  @ApiResponse({ status: HttpStatus.OK, type: AuthResponseDto, description: 'Tokens refreshed.' })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired refresh token.',
  })
  @UseGuards(JwtRefreshGuard, CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.REFRESH_TOKEN, ttl: THROTTLE_TTL_MS } })
  @HttpCode(HttpStatus.OK)
  @Serialize(AuthResponseDto)
  @AuditLog(AuditEventType.TOKEN_REFRESHED)
  async refreshToken(
    @Req() req: Request,
    @CurrentUser()
    user: RefreshTokenUser,
  ) {
    const { data, auditOverride } = await this.authService.refreshToken(user);
    // auditOverride can be used to customize the audit log success event
    if (auditOverride) {
      req.auditOverride = auditOverride;
    }
    return data;
  }

  @Delete('logout')
  @ApiBffAndRefreshSecurity()
  @ApiOperation({ summary: 'Revoke the current refresh token family (single device logout)' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Logged out successfully.' })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired refresh token.',
  })
  @UseGuards(JwtRefreshGuard, CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.LOGOUT, ttl: THROTTLE_TTL_MS } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @AuditLog(AuditEventType.USER_LOGOUT)
  async logout(@CurrentUser() user: RefreshTokenUser) {
    return this.authService.logout(user);
  }

  @Delete('logout-all')
  @ApiBffAndAccessSecurity()
  @ApiOperation({ summary: 'Revoke all refresh tokens for the user (all devices logout)' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'All sessions revoked.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid or expired access token.' })
  @UseGuards(JwtAuthGuard, CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.LOGOUT_ALL_DEVICES, ttl: THROTTLE_TTL_MS } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @AuditLog(AuditEventType.USER_LOGOUT_ALL_DEVICES)
  async logoutAllDevices(@CurrentUser('userId') userId: string) {
    return this.authService.logoutAllDevices(userId);
  }

  @Patch('update-password')
  @ApiBffAndAccessSecurity()
  @ApiOperation({ summary: 'Update password and re-issue tokens (invalidates all other sessions)' })
  @ApiResponse({ status: HttpStatus.OK, type: AuthResponseDto, description: 'Password updated.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Validation failed.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid or expired access token.' })
  @UseGuards(JwtAuthGuard, CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.UPDATE_PASSWORD, ttl: THROTTLE_TTL_MS } })
  @Serialize(AuthResponseDto)
  @AuditLog(AuditEventType.PASSWORD_CHANGED)
  async updatePassword(@CurrentUser('userId') userId: string, @Body() body: UpdatePasswordDto) {
    return this.authService.updatePasswordAndReauthenticate(userId, body);
  }

  @Post('forgot-password')
  @ApiBffSecurity()
  @ApiOperation({ summary: 'Request a password reset email' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description:
      'Reset email sent if the address is registered. Response is identical either way to prevent user enumeration.',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Validation failed.' })
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.FORGOT_PASSWORD, ttl: THROTTLE_TTL_MS } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @AuditLog(AuditEventType.PASSWORD_FORGOTTEN)
  async forgotPassword(@Body() body: AuthForgotPasswordDto) {
    return this.authService.forgotPassword(body);
  }

  @Post('reset-password')
  @ApiBffSecurity()
  @ApiOperation({ summary: 'Reset password using a token from the reset email' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Password reset successfully.' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Token invalid, expired, or already used.',
  })
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.RESET_PASSWORD, ttl: THROTTLE_TTL_MS } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @AuditLog(AuditEventType.PASSWORD_RESET)
  async resetPassword(@Body() body: AuthResetPasswordDto) {
    return this.authService.resetPassword(body);
  }
}
