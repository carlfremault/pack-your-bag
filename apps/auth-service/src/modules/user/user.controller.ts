import { Body, Controller, Patch, UseGuards } from '@nestjs/common';

import { CurrentUser } from '@/common/decorators/current-user.decorator';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { UpdatePasswordDto } from './dto/update-password.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Patch('update-password')
  async updatePassword(@CurrentUser('userId') userId: string, @Body() body: UpdatePasswordDto) {
    await this.userService.updatePassword(userId, body);
    return { message: 'Password updated successfully' };
  }
}
