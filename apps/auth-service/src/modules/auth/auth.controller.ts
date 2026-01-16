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
import { Throttle } from '@nestjs/throttler';

import type { Request } from 'express';

import { AuditLog } from '@/common/decorators/audit-log.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Serialize } from '@/common/interceptors/serialize.interceptor';
import type { RefreshTokenUser } from '@/common/interfaces/refresh-token-user.interface';
import { AuthCredentialsDto } from '@/modules/auth/dto/auth-credentials';
import { UpdatePasswordDto } from '@/modules/user/dto/update-password.dto';

import { AuthResponseDto } from './dto/auth-response.dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtRefreshGuard } from './jwt-refresh.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  @Serialize(AuthResponseDto)
  @AuditLog('USER_REGISTERED')
  async register(@Body() body: AuthCredentialsDto) {
    return this.authService.register(body);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Serialize(AuthResponseDto)
  @AuditLog('USER_LOGIN_SUCCESS')
  async login(@Body() body: AuthCredentialsDto) {
    return this.authService.login(body);
  }

  @UseGuards(JwtRefreshGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @Serialize(AuthResponseDto)
  @AuditLog('TOKEN_REFRESHED')
  async refreshToken(
    @Req() req: Request,
    @CurrentUser()
    { userId, tokenId, tokenFamilyId }: RefreshTokenUser,
  ) {
    const result = await this.authService.refreshToken(userId, tokenId, tokenFamilyId);
    // auditOverride can be used to customize the audit log success event
    if (result.auditOverride) {
      req.auditOverride = result.auditOverride;
    }
    return result;
  }

  @UseGuards(JwtRefreshGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Delete('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AuditLog('USER_LOGOUT')
  async logout(@CurrentUser() { userId, tokenFamilyId }: RefreshTokenUser) {
    return this.authService.logout(userId, tokenFamilyId);
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Delete('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AuditLog('USER_LOGOUT_ALL_DEVICES')
  async logoutAllDevices(@CurrentUser('userId') userId: string) {
    return this.authService.logoutAllDevices(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Patch('update-password')
  @Serialize(AuthResponseDto)
  @AuditLog('PASSWORD_CHANGED')
  async updatePassword(@CurrentUser('userId') userId: string, @Body() body: UpdatePasswordDto) {
    return this.authService.updatePasswordAndReauthenticate(userId, body);
  }
}
