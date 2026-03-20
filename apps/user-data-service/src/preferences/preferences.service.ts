import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { plainToInstance } from 'class-transformer';
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
    const result = await this.preferenceModel.findOneAndUpdate(
      { userId },
      { ...preference, userId },
      {
        upsert: true,
        returnDocument: 'after',
        setDefaultsOnInsert: true,
      },
    );
    return plainToInstance(PreferencesResponseDto, result);
  }

  async getPreference(userId: string): Promise<PreferencesResponseDto | null> {
    const result = await this.preferenceModel.findOne({ userId });
    return result ? plainToInstance(PreferencesResponseDto, result) : null;
  }

  async updatePreference(
    userId: string,
    preference: UpdatePreferencesDto,
  ): Promise<PreferencesResponseDto | null> {
    const result = await this.preferenceModel.findOneAndUpdate(
      { userId },
      { ...preference, userId },
      { returnDocument: 'after' },
    );
    return result ? plainToInstance(PreferencesResponseDto, result) : null;
  }

  async deletePreference(userId: string): Promise<boolean> {
    const result = await this.preferenceModel.findOneAndDelete({ userId });
    return result !== null;
  }
}
