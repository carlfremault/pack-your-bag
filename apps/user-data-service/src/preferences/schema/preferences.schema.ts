import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { HydratedDocument } from 'mongoose';

export type PreferenceDocument = HydratedDocument<Preference>;

@Schema({ timestamps: true })
export class Preference {
  @Prop({ required: true, unique: true, index: true })
  userId: string;

  @Prop({ enum: ['metric', 'imperial'] })
  units: 'metric' | 'imperial' = 'metric';

  @Prop({ enum: ['light', 'dark'] })
  theme: 'light' | 'dark';

  @Prop({
    enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY/MM/DD', 'DD-MM-YYYY', 'MM-DD-YYYY', 'YYYY-MM-DD'],
  })
  dateFormat:
    | 'DD/MM/YYYY'
    | 'MM/DD/YYYY'
    | 'YYYY/MM/DD'
    | 'DD-MM-YYYY'
    | 'MM-DD-YYYY'
    | 'YYYY-MM-DD';

  @Prop({ enum: ['12h', '24h'] })
  timeFormat: '12h' | '24h';
}

export const PreferenceSchema = SchemaFactory.createForClass(Preference);
