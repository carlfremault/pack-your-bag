export type CategoryColor =
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

export interface CategoryColorConfig {
  label: string;
  className: string;
}

export const categoryColors: Record<CategoryColor, CategoryColorConfig> = {
  ocean: {
    label: 'Ocean',
    className: 'bg-cat-ocean-bg    border-cat-ocean-border    text-cat-ocean-text',
  },
  sky: {
    label: 'Sky',
    className: 'bg-cat-sky-bg      border-cat-sky-border      text-cat-sky-text',
  },
  lagoon: {
    label: 'Lagoon',
    className: 'bg-cat-lagoon-bg   border-cat-lagoon-border   text-cat-lagoon-text',
  },
  sunset: {
    label: 'Sunset',
    className: 'bg-cat-sunset-bg   border-cat-sunset-border   text-cat-sunset-text',
  },
  sand: {
    label: 'Sand',
    className: 'bg-cat-sand-bg     border-cat-sand-border     text-cat-sand-text',
  },
  coral: {
    label: 'Coral',
    className: 'bg-cat-coral-bg    border-cat-coral-border    text-cat-coral-text',
  },
  jungle: {
    label: 'Jungle',
    className: 'bg-cat-jungle-bg   border-cat-jungle-border   text-cat-jungle-text',
  },
  lavender: {
    label: 'Lavender',
    className: 'bg-cat-lavender-bg border-cat-lavender-border text-cat-lavender-text',
  },
  rose: {
    label: 'Rose',
    className: 'bg-cat-rose-bg     border-cat-rose-border     text-cat-rose-text',
  },
  slate: {
    label: 'Slate',
    className: 'bg-cat-slate-bg    border-cat-slate-border    text-cat-slate-text',
  },
};
