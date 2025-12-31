import bcrypt from 'bcrypt';
import { uuidv7 } from 'uuidv7';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma-client';
import { UserService } from '@/modules/user/user.service';
import { UserDto } from '@/modules/user/dtos/user.dto';

// We only make 'user' roles for now
const DEFAULT_USER_ROLE_ID = 1;
const BCRYPT_SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(private userService: UserService) {}

  async register(body: UserDto) {
    const { email, password } = body;

    const uuid = uuidv7();
    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    const data: Prisma.UserCreateInput = {
      id: uuid,
      email,
      password: hashedPassword,
      role: {
        connect: { id: DEFAULT_USER_ROLE_ID },
      },
    };

    return this.userService.createUser(data);
  }
}
