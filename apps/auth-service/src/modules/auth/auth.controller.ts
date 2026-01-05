import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { Serialize } from '@/common/interceptors/serialize.interceptor';
import { UserDto } from '@/modules/user/dtos/user.dto';
import { UserEntity } from '@/modules/user/dtos/userEntity.dto';

import { AuthService } from './auth.service';

@Controller('auth')
@Serialize(UserEntity)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('/register')
  async register(@Body() body: UserDto) {
    return this.authService.register(body);
  }
}
