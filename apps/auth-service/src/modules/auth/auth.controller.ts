import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { Serialize } from '@/common/interceptors/serialize.interceptor';
import { UserDto } from '@/modules/user/dto/user.dto';

import { AuthResponseDto } from './dto/auth-response.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Serialize(AuthResponseDto)
  @Post('register')
  async register(@Body() body: UserDto) {
    return this.authService.register(body);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Serialize(AuthResponseDto)
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signin(@Body() body: UserDto) {
    return this.authService.signin(body);
  }
}
