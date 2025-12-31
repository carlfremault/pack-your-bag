import bcrypt from 'bcrypt';
import { uuidv7 } from 'uuidv7';
import { Prisma } from '@prisma-client';
import { Injectable } from '@nestjs/common';
import { UserService } from '@/modules/user/user.service';

// We only make 'user' roles for now
const DEFAULT_USER_ROLE_ID = 1;

@Injectable()
export class AuthService {
  constructor(private userService: UserService) {}

  async register(email: string, password: string) {
    const uuid = uuidv7();
    const role = DEFAULT_USER_ROLE_ID;

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const data: Prisma.UserCreateInput = {
      id: uuid,
      email,
      password: hashedPassword,
      role: {
        connect: { id: role },
      },
    };

    return this.userService.createUser(data);
  }
}
