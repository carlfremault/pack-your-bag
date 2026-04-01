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
    className:
      'bg-[var(--color-ocean-bg)] border-[var(--color-ocean-border)] text-[var(--color-ocean-text)]',
  },
  sky: {
    label: 'Sky',
    className:
      'bg-[var(--color-sky-bg)] border-[var(--color-sky-border)] text-[var(--color-sky-text)]',
  },
  lagoon: {
    label: 'Lagoon',
    className:
      'bg-[var(--color-lagoon-bg)] border-[var(--color-lagoon-border)] text-[var(--color-lagoon-text)]',
  },
  sunset: {
    label: 'Sunset',
    className:
      'bg-[var(--color-sunset-bg)] border-[var(--color-sunset-border)] text-[var(--color-sunset-text)]',
  },
  sand: {
    label: 'Sand',
    className:
      'bg-[var(--color-sand-bg)] border-[var(--color-sand-border)] text-[var(--color-sand-text)]',
  },
  coral: {
    label: 'Coral',
    className:
      'bg-[var(--color-coral-bg)] border-[var(--color-coral-border)] text-[var(--color-coral-text)]',
  },
  jungle: {
    label: 'Jungle',
    className:
      'bg-[var(--color-jungle-bg)] border-[var(--color-jungle-border)] text-[var(--color-jungle-text)]',
  },
  lavender: {
    label: 'Lavender',
    className:
      'bg-[var(--color-lavender-bg)] border-[var(--color-lavender-border)] text-[var(--color-lavender-text)]',
  },
  rose: {
    label: 'Rose',
    className:
      'bg-[var(--color-rose-bg)] border-[var(--color-rose-border)] text-[var(--color-rose-text)]',
  },
  slate: {
    label: 'Slate',
    className:
      'bg-[var(--color-slate-bg)] border-[var(--color-slate-border)] text-[var(--color-slate-text)]',
  },
};
