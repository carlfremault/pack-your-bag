export type ColorTheme =
  | 'ocean'
  | 'sky'
  | 'lagoon'
  | 'sunset'
  | 'sand'
  | 'coral'
  | 'jungle'
  | 'lavender'
  | 'rose'
  | 'slate';

export interface ColorThemeConfig {
  label: string;
  className: string;
}

export const colorThemes: Record<ColorTheme, ColorThemeConfig> = {
  ocean: {
    label: 'Ocean',
    className: 'bg-ocean-bg border-ocean-border text-ocean-text',
  },
  sky: {
    label: 'Sky',
    className: 'bg-sky-bg border-sky-border text-sky-text',
  },
  lagoon: {
    label: 'Lagoon',
    className: 'bg-lagoon-bg border-lagoon-border text-lagoon-text',
  },
  sunset: {
    label: 'Sunset',
    className: 'bg-sunset-bg border-sunset-border text-sunset-text',
  },
  sand: {
    label: 'Sand',
    className: 'bg-sand-bg border-sand-border text-sand-text',
  },
  coral: {
    label: 'Coral',
    className: 'bg-coral-bg border-coral-border text-coral-text',
  },
  jungle: {
    label: 'Jungle',
    className: 'bg-jungle-bg border-jungle-border text-jungle-text',
  },
  lavender: {
    label: 'Lavender',
    className: 'bg-lavender-bg border-lavender-border text-lavender-text',
  },
  rose: {
    label: 'Rose',
    className: 'bg-rose-bg border-rose-border text-rose-text',
  },
  slate: {
    label: 'Slate',
    className: 'bg-slate-bg border-slate-border text-slate-text',
  },
};
