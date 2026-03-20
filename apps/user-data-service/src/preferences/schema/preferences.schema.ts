import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { HydratedDocument } from 'mongoose';

import { DateFormat, Theme, TimeFormat, Units } from '../types/preferences.types';

export type PreferenceDocument = HydratedDocument<Preference>;

@Schema({ timestamps: true })
export class Preference {
  @Prop({ required: true, unique: true, index: true })
  userId: string;

  @Prop({ type: String, enum: Object.values(Units) })
  units: Units = Units.METRIC;

  @Prop({ type: String, enum: Object.values(Theme) })
  theme: Theme;

  @Prop({ type: String, enum: Object.values(DateFormat) })
  dateFormat: DateFormat;

  @Prop({ type: String, enum: Object.values(TimeFormat) })
  timeFormat: TimeFormat;
}

export const PreferenceSchema = SchemaFactory.createForClass(Preference);
