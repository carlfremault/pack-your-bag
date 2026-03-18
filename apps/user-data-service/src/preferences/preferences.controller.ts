import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { Preference } from './schema/preferences.schema';
import { PreferencesService } from './preferences.service';

@Controller('preferences')
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Post()
  async createPreference(@Body() preference: Preference): Promise<Preference> {
    return this.preferencesService.createPreference(preference);
  }

  @Get(':userId')
  async getPreference(@Param('userId') userId: string): Promise<Preference | null> {
    return this.preferencesService.getPreference(userId);
  }

  @Patch(':userId')
  async updatePreference(
    @Param('userId') userId: string,
    @Body() preference: Preference,
  ): Promise<Preference | null> {
    return this.preferencesService.updatePreference(userId, preference);
  }

  @Delete(':userId')
  async deletePreference(@Param('userId') userId: string): Promise<boolean> {
    return this.preferencesService.deletePreference(userId);
  }
}
