import { ForbiddenException } from '@nestjs/common';

import { MS_PER_DAY } from '@/common/constants/auth.constants';
import { User } from '@/generated/prisma';

import { AccountDeletedException } from '../exceptions/forbidden.exceptions';

export class DeletedUserHelper {
  static checkDeletedUser(user: User, retentionDays: number): void {
    if (!user.isDeleted) {
      return;
    }

    if (!user.deletedAt) {
      throw new ForbiddenException('Account is in an invalid state. Please contact support.');
    }

    const deletedAtDate =
      user.deletedAt instanceof Date ? user.deletedAt : new Date(user.deletedAt);
    const deletionDate = new Date(deletedAtDate.getTime() + retentionDays * MS_PER_DAY);
    const daysRemaining = Math.max(
      0,
      Math.ceil((deletionDate.getTime() - Date.now()) / MS_PER_DAY),
    );

    throw new AccountDeletedException(daysRemaining);
  }
}
