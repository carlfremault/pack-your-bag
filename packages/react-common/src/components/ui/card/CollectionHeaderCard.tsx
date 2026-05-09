import { BsBackpack } from 'react-icons/bs';
import { HiOutlineScale } from 'react-icons/hi2';
import { MdDeleteOutline, MdOutlineEdit, MdOutlineFormatListBulleted } from 'react-icons/md';

import classNames from 'classnames';

import { ColorTheme, colorThemes } from '../../../lib/colorThemes';
import { Button } from '../button';
import { CategoryPillProps } from '../pill/CategoryPill';
import { ExpandableCategoryPills, ExpandableText } from '../utils';

export interface CollectionHeaderCardProps {
  id: string;
  name: string;
  description?: string;
  colorTheme?: ColorTheme;
  type: 'list' | 'pack';
  itemCount: number;
  totalWeight: string;
  weightUnit?: string;
  categoryWeights?: {
    category: CategoryPillProps;
    weight: string;
  }[];
  onEditCollection: (id: string, type: 'list' | 'pack') => void;
  onDeleteCollection: (id: string, type: 'list' | 'pack') => void;
}

export function CollectionHeaderCard(props: CollectionHeaderCardProps) {
  const {
    id,
    name,
    description,
    colorTheme = 'default',
    type,
    itemCount,
    totalWeight,
    weightUnit,
    categoryWeights,
    onEditCollection,
    onDeleteCollection,
  } = props;

  const { className: colorThemeClassName } = colorThemes[colorTheme] ?? colorThemes['default'];
  const collectionHeaderCardClassName = classNames(
    'flex w-full flex-col sm:flex-row rounded-md border gap-6 sm:gap-8 shadow-sm p-4',
    colorThemeClassName,
  );

  const Icon = type === 'list' ? MdOutlineFormatListBulleted : BsBackpack;

  return (
    <div className={collectionHeaderCardClassName}>
      <div className="flex min-w-1/5 flex-none flex-row justify-between gap-4 sm:flex-col">
        <div className="self-center p-4">
          <Icon size={36} className="text-primary" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex justify-between gap-4 text-nowrap">
            <div className="text-xs">{`${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}</div>
            <div className="flex items-center gap-1 text-xs">
              <HiOutlineScale className="h-3 w-3" aria-hidden="true" />
              {`${totalWeight}${weightUnit ? ` ${weightUnit}` : ''}`}
            </div>
          </div>
          {categoryWeights && <ExpandableCategoryPills items={categoryWeights} />}
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-between gap-4">
        <div className="flex flex-col gap-4">
          <h2 className="text-primary text-xl sm:pt-4">{name}</h2>
          {description && <ExpandableText text={description} maxLines={3} />}
        </div>
        <div className="flex justify-end gap-8">
          <Button
            variant="unstyledIcon"
            color="primary"
            aria-label={`Edit ${name}`}
            onClick={() => onEditCollection(id, type)}
          >
            <MdOutlineEdit className="h-6 w-6" aria-hidden="true" />
          </Button>
          <Button
            variant="unstyledIcon"
            color="danger"
            aria-label={`Delete ${name}`}
            onClick={() => onDeleteCollection(id, type)}
          >
            <MdDeleteOutline className="h-6 w-6" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
