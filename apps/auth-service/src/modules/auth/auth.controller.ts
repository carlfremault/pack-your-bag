import { Body, Controller, Delete, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Serialize } from '@/common/interceptors/serialize.interceptor';
import type { RefreshTokenUser } from '@/common/interfaces/refresh-token-user.interface';
import { AuthCredentialsDto } from '@/modules/user/dto/auth-credentials';

import { AuthResponseDto } from './dto/auth-response.dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtRefreshGuard } from './jwt-refresh.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Serialize(AuthResponseDto)
  @Post('register')
  async register(@Body() body: AuthCredentialsDto) {
    return this.authService.register(body);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Serialize(AuthResponseDto)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: AuthCredentialsDto) {
    return this.authService.login(body);
  }

  @UseGuards(JwtRefreshGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Serialize(AuthResponseDto)
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @CurrentUser()
    { userId, tokenId, tokenFamilyId }: RefreshTokenUser,
  ) {
    return this.authService.refreshToken(userId, tokenId, tokenFamilyId);
  }

  @UseGuards(JwtRefreshGuard)
  @Delete('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@CurrentUser() { userId, tokenFamilyId }: RefreshTokenUser) {
    return this.authService.logout(userId, tokenFamilyId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutAllDevices(@CurrentUser('userId') userId: string) {
    return this.authService.logoutAllDevices(userId);
  }
}
