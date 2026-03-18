import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Preference, PreferenceSchema } from './schema/preferences.schema';
import { PreferencesController } from './preferences.controller';
import { PreferencesService } from './preferences.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Preference.name, schema: PreferenceSchema }])],
  exports: [PreferencesService],
  controllers: [PreferencesController],
  providers: [PreferencesService],
})
export class PreferencesModule {}
