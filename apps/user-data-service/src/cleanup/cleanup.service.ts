import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { AuditEventType, AuditSeverity } from '@repo/db';
import { AuditLogProvider } from '@repo/nestjs-common';

import { Model } from 'mongoose';

import { Preference, PreferenceDocument } from '../preferences/schema/preferences.schema';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(
    @InjectModel(Preference.name) private preferenceModel: Model<PreferenceDocument>,
    private readonly auditLogProvider: AuditLogProvider,
  ) {}

  async deleteUserData(userIds: string[]): Promise<void> {
    const result = await this.preferenceModel.deleteMany({ userId: { $in: userIds } });

    const auditMessage = `Cleaned up User data for User IDs [${userIds.join(', ')}]: Deleted ${result.deletedCount} preferences`;

    this.logger.log(auditMessage);
    this.auditLogProvider.auditRequest({
      eventType: AuditEventType.SCHEDULED_TASK,
      severity: AuditSeverity.INFO,
      statusCode: HttpStatus.NO_CONTENT,
      message: auditMessage,
    });
  }
}
