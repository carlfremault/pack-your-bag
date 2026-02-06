import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';

import { User } from '@prisma-client';

import { DeletedUserHelper } from '@/common/helpers/deleted-user.helper';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly retentionDays: number;

  constructor(private readonly configService: ConfigService) {
    super();
    this.retentionDays = this.configService.get<number>('AUTH_USER_DELETE_RETENTION_DAYS', 30);
  }
  handleRequest<TUser = User>(err: Error | null, user: TUser | false): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException('Access Denied');
    }

    DeletedUserHelper.checkDeletedUser(user as unknown as User, this.retentionDays);

    return user;
  }
}
