import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { Serialize } from '@/common/interceptors/serialize.interceptor';
import { RegisterAndSignInDto } from '@/modules/user/dto/register-and-sign-in.dto';

import { AuthResponseDto } from './dto/auth-response.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Serialize(AuthResponseDto)
  @Post('register')
  async register(@Body() body: RegisterAndSignInDto) {
    return this.authService.register(body);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Serialize(AuthResponseDto)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: RegisterAndSignInDto) {
    return this.authService.login(body);
  }
}
