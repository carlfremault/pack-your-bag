import { ForbiddenException } from '@nestjs/common';

import { User } from '@repo/db';

import { MS_PER_DAY } from '../constants/common.constants';
import { AccountDeletedException } from '../exceptions/forbidden.exceptions';

const INVALID_ACCOUNT_STATE_MSG = 'Account is in an invalid state. Please contact support.';

export class DeletedUserHelper {
  static checkDeletedUser(user: User, retentionDays: number): void {
    if (!user.isDeleted) {
      return;
    }

    if (!user.deletedAt) {
      throw new ForbiddenException(INVALID_ACCOUNT_STATE_MSG);
    }

    const deletedAtDate =
      user.deletedAt instanceof Date ? user.deletedAt : new Date(user.deletedAt);
    if (isNaN(deletedAtDate.getTime())) {
      throw new ForbiddenException(INVALID_ACCOUNT_STATE_MSG);
    }

    const daysRemaining = calculateDaysRemaining(user.deletedAt, retentionDays);
    throw new AccountDeletedException(daysRemaining);
  }
}

function calculateDaysRemaining(deletedAt: Date | string, retentionDays: number): number {
  const deletedAtDate = deletedAt instanceof Date ? deletedAt : new Date(deletedAt);

  const deletionDate = new Date(deletedAtDate.getTime() + retentionDays * MS_PER_DAY);

  return Math.max(0, Math.ceil((deletionDate.getTime() - Date.now()) / MS_PER_DAY));
}
