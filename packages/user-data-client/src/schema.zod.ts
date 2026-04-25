import { z } from 'zod';

export const PreferencesResponseDto = z
  .object({
    userId: z.string(),
    units: z.enum(['metric', 'imperial']),
    theme: z.enum(['light', 'dark']).nullable(),
    dateFormat: z.enum([
      'DD/MM/YYYY',
      'MM/DD/YYYY',
      'YYYY/MM/DD',
      'DD-MM-YYYY',
      'MM-DD-YYYY',
      'YYYY-MM-DD',
    ]),
    timeFormat: z.enum(['12h', '24h']),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const CreatePreferencesDto = z
  .object({
    units: z.enum(['metric', 'imperial']),
    theme: z.enum(['light', 'dark']).nullable(),
    dateFormat: z.enum([
      'DD/MM/YYYY',
      'MM/DD/YYYY',
      'YYYY/MM/DD',
      'DD-MM-YYYY',
      'MM-DD-YYYY',
      'YYYY-MM-DD',
    ]),
    timeFormat: z.enum(['12h', '24h']),
  })
  .passthrough();
export const UpdatePreferencesDto = z
  .object({
    units: z.enum(['metric', 'imperial']),
    theme: z.enum(['light', 'dark']).nullable(),
    dateFormat: z.enum([
      'DD/MM/YYYY',
      'MM/DD/YYYY',
      'YYYY/MM/DD',
      'DD-MM-YYYY',
      'MM-DD-YYYY',
      'YYYY-MM-DD',
    ]),
    timeFormat: z.enum(['12h', '24h']),
  })
  .partial()
  .passthrough();
