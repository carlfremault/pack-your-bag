export type ColorTheme =
  | 'default'
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
  focusClassName: string;
}

export const colorThemes: Record<ColorTheme, ColorThemeConfig> = {
  default: {
    label: 'Default',
    className: 'bg-surface border-primary-ring text-primary',
    focusClassName: 'focus-visible:ring-primary-ring',
  },
  ocean: {
    label: 'Ocean',
    className: 'bg-ocean-bg border-ocean-border text-ocean-text',
    focusClassName: 'focus-visible:ring-ocean-border',
  },
  sky: {
    label: 'Sky',
    className: 'bg-sky-bg border-sky-border text-sky-text',
    focusClassName: 'focus-visible:ring-sky-border',
  },
  lagoon: {
    label: 'Lagoon',
    className: 'bg-lagoon-bg border-lagoon-border text-lagoon-text',
    focusClassName: 'focus-visible:ring-lagoon-border',
  },
  sunset: {
    label: 'Sunset',
    className: 'bg-sunset-bg border-sunset-border text-sunset-text',
    focusClassName: 'focus-visible:ring-sunset-border',
  },
  sand: {
    label: 'Sand',
    className: 'bg-sand-bg border-sand-border text-sand-text',
    focusClassName: 'focus-visible:ring-sand-border',
  },
  coral: {
    label: 'Coral',
    className: 'bg-coral-bg border-coral-border text-coral-text',
    focusClassName: 'focus-visible:ring-coral-border',
  },
  jungle: {
    label: 'Jungle',
    className: 'bg-jungle-bg border-jungle-border text-jungle-text',
    focusClassName: 'focus-visible:ring-jungle-border',
  },
  lavender: {
    label: 'Lavender',
    className: 'bg-lavender-bg border-lavender-border text-lavender-text',
    focusClassName: 'focus-visible:ring-lavender-border',
  },
  rose: {
    label: 'Rose',
    className: 'bg-rose-bg border-rose-border text-rose-text',
    focusClassName: 'focus-visible:ring-rose-border',
  },
  slate: {
    label: 'Slate',
    className: 'bg-slate-bg border-slate-border text-slate-text',
    focusClassName: 'focus-visible:ring-slate-border',
  },
};
