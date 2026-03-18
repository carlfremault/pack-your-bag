import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { CreatePreferencesDto } from './dto/create-preferences.dto';
import { PreferencesResponseDto } from './dto/preferences-response.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { Preference, PreferenceDocument } from './schema/preferences.schema';

@Injectable()
export class PreferencesService {
  constructor(@InjectModel(Preference.name) private preferenceModel: Model<PreferenceDocument>) {}

  async createPreference(
    preference: CreatePreferencesDto,
    userId: string,
  ): Promise<PreferencesResponseDto> {
    return this.preferenceModel.findOneAndUpdate(
      { userId },
      { ...preference, userId },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );
  }

  async getPreference(userId: string): Promise<PreferencesResponseDto | null> {
    return this.preferenceModel.findOne({ userId });
  }

  async updatePreference(
    userId: string,
    preference: UpdatePreferencesDto,
  ): Promise<PreferencesResponseDto | null> {
    return this.preferenceModel.findOneAndUpdate(
      { userId },
      { ...preference, userId },
      { new: true },
    );
  }

  async deletePreference(userId: string): Promise<boolean> {
    const result = await this.preferenceModel.findOneAndDelete({ userId });
    return result !== null;
  }
}
