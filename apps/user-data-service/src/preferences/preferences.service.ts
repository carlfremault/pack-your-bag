import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { Preference, PreferenceDocument } from './schema/preferences.schema';

@Injectable()
export class PreferencesService {
  constructor(@InjectModel(Preference.name) private preferenceModel: Model<PreferenceDocument>) {}

  async createPreference(preference: Preference): Promise<PreferenceDocument> {
    return this.preferenceModel.findOneAndUpdate({ userId: preference.userId }, preference, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
  }

  async getPreference(userId: string): Promise<PreferenceDocument | null> {
    return this.preferenceModel.findOne({ userId });
  }

  async updatePreference(
    userId: string,
    preference: Preference,
  ): Promise<PreferenceDocument | null> {
    return this.preferenceModel.findOneAndUpdate({ userId }, preference, { new: true });
  }

  async deletePreference(userId: string): Promise<boolean> {
    const result = await this.preferenceModel.findOneAndDelete({ userId });
    return result !== null;
  }
}
