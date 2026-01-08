import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Prisma, User } from '@prisma-client';
import bcrypt from 'bcrypt';

import { PrismaService } from '@/prisma/prisma.service';

import { UpdatePasswordDto } from './dto/update-password.dto';

@Injectable()
export class UserService {
  private readonly bcryptSaltRounds: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.bcryptSaltRounds = this.configService.get<number>('AUTH_BCRYPT_SALT_ROUNDS', 10);
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    return await this.prisma.user.create({
      data,
    });
  }

  async getUser(where: Prisma.UserWhereUniqueInput): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where,
    });
  }

  async updatePassword(userId: string, body: UpdatePasswordDto): Promise<void> {
    const { currentPassword, newPassword } = body;

    if (currentPassword === newPassword) {
      throw new BadRequestException('New password and current password cannot be the same');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Current password does not match');
    }

    const hashedPassword = await bcrypt.hash(newPassword, this.bcryptSaltRounds);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }
}
