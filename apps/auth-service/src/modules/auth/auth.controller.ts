import { Body, Controller, Post } from '@nestjs/common';
import { UserDto } from '@/modules/user/dtos/user.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/register')
  async register(@Body() body: UserDto) {
    return this.authService.register(body);
  }
}
