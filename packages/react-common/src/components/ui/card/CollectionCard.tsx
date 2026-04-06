import { BsBackpack } from 'react-icons/bs';
import { MdOutlineFormatListBulleted } from 'react-icons/md';

import classNames from 'classnames';

import { ColorTheme, colorThemes } from '#lib/colorThemes';

export interface CollectionCardProps {
  id: string;
  name: string;
  description?: string;
  colorTheme?: ColorTheme;
  type: 'list' | 'pack';
  numberOfItems: number;
  onOpenCollection: (id: string) => void;
}

export default function CollectionCard(props: CollectionCardProps) {
  const {
    id,
    name,
    description,
    colorTheme = 'slate',
    type,
    numberOfItems,
    onOpenCollection,
  } = props;

  const { className: colorThemeClassName } = colorThemes[colorTheme];
  const collectionCardClassName = classNames(
    'flex w-full flex-col items-start justify-between gap-2 rounded-md border p-3 text-left shadow-sm min-h-50 transition-transform duration-150 hover:-translate-y-0.5 ease-out cursor-pointer hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary)] active:translate-y-0.5',
    colorThemeClassName,
  );

  const Icon = type === 'list' ? MdOutlineFormatListBulleted : BsBackpack;

  const nameId = `collection-card-name-${id}`;
  const descriptionId = `collection-card-description-${id}`;
  const countId = `collection-card-count-${id}`;
  const describedBy = description ? `${descriptionId} ${countId}` : countId;

  return (
    <button
      type="button"
      onClick={() => onOpenCollection(id)}
      aria-labelledby={nameId}
      aria-describedby={describedBy}
      className={collectionCardClassName}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      <div className="flex w-full min-w-0 flex-col items-start justify-between gap-1">
        <span id={nameId} className="truncate text-sm font-bold">
          {name}
        </span>
        {description && (
          <div id={descriptionId} className="text-xs font-light">
            {description}
          </div>
        )}
        <div id={countId} className="flex items-center gap-1 text-xs">
          {`${numberOfItems} ${numberOfItems === 1 ? 'item' : 'items'}`}
        </div>
      </div>
    </button>
  );
}
