import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { Preference, PreferenceDocument } from '../preferences/schema/preferences.schema';

import { CleanupResultDto } from './dto/cleanup-users.dto';

@Injectable()
export class CleanupService {
  constructor(@InjectModel(Preference.name) private preferenceModel: Model<PreferenceDocument>) {}

  async deleteUserData(userIds: string[]): Promise<CleanupResultDto> {
    const result = await this.preferenceModel.deleteMany({ userId: { $in: userIds } });
    return { deletedPreferences: result.deletedCount };
  }
}
