import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Prisma } from '@prisma-client';
import bcrypt from 'bcrypt';
import { uuidv7 } from 'uuidv7';

import { UserDto } from '@/modules/user/dtos/user.dto';
import { UserService } from '@/modules/user/user.service';

@Injectable()
export class AuthService {
  private readonly bcryptSaltRounds: number;
  private readonly defaultUserRoleId: number;

  constructor(
    private configService: ConfigService,
    private userService: UserService,
  ) {
    this.bcryptSaltRounds = this.configService.get<number>('AUTH_BCRYPT_SALT_ROUNDS', 10);
    this.defaultUserRoleId = this.configService.get<number>('AUTH_DEFAULT_USER_ROLE_ID', 1);
  }

  async register(body: UserDto) {
    const { email, password } = body;

    const uuid = uuidv7();
    const hashedPassword = await bcrypt.hash(password, this.bcryptSaltRounds);

    const data: Prisma.UserCreateInput = {
      id: uuid,
      email,
      password: hashedPassword,
      role: {
        connect: { id: this.defaultUserRoleId },
      },
    };

    //  TODO: return JWT token upon successful registration
    return this.userService.createUser(data);
  }
}
