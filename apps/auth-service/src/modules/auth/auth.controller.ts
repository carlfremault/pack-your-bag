import { UserDto } from '@/modules/user/dtos/user.dto';
import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/register')
  async register(@Body() body: UserDto) {
    const { email, password } = body;
    return this.authService.register(email, password);
  }
}
