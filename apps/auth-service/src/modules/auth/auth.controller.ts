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
import { CustomThrottlerGuard } from '@/common/guards/custom-throttler.guard';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { JwtRefreshGuard } from '@/common/guards/jwt-refresh.guard';
import { Serialize } from '@/common/interceptors/serialize.interceptor';
import type { RefreshTokenUser } from '@/common/interfaces/refresh-token-user.interface';
import { AuthCredentialsDto } from '@/modules/auth/dto/auth-credentials';
import { UpdatePasswordDto } from '@/modules/user/dto/update-password.dto';

import { AuthResponseDto } from './dto/auth-response.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  @Serialize(AuthResponseDto)
  @AuditLog('USER_REGISTERED')
  async register(@Body() body: AuthCredentialsDto) {
    return this.authService.register(body);
  }

  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Serialize(AuthResponseDto)
  @AuditLog('USER_LOGIN_SUCCESS')
  async login(@Body() body: AuthCredentialsDto) {
    return this.authService.login(body);
  }

  @UseGuards(JwtRefreshGuard, CustomThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @Serialize(AuthResponseDto)
  @AuditLog('TOKEN_REFRESHED')
  async refreshToken(
    @Req() req: Request,
    @CurrentUser()
    user: RefreshTokenUser,
  ) {
    const result = await this.authService.refreshToken(user);
    // auditOverride can be used to customize the audit log success event
    if (result.auditOverride) {
      req.auditOverride = result.auditOverride;
    }
    return result;
  }

  @UseGuards(JwtRefreshGuard, CustomThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Delete('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AuditLog('USER_LOGOUT')
  async logout(@CurrentUser() user: RefreshTokenUser) {
    return this.authService.logout(user);
  }

  @UseGuards(JwtAuthGuard, CustomThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Delete('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AuditLog('USER_LOGOUT_ALL_DEVICES')
  async logoutAllDevices(@CurrentUser('userId') userId: string) {
    return this.authService.logoutAllDevices(userId);
  }

  @UseGuards(JwtAuthGuard, CustomThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Patch('update-password')
  @Serialize(AuthResponseDto)
  @AuditLog('PASSWORD_CHANGED')
  async updatePassword(@CurrentUser('userId') userId: string, @Body() body: UpdatePasswordDto) {
    return this.authService.updatePasswordAndReauthenticate(userId, body);
  }
}
