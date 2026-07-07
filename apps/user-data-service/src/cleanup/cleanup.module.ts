import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Preference, PreferenceSchema } from '../preferences/schema/preferences.schema';

import { CleanupController } from './cleanup.controller';
import { CleanupService } from './cleanup.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Preference.name, schema: PreferenceSchema }])],
  controllers: [CleanupController],
  providers: [CleanupService],
})
export class CleanupModule {}
