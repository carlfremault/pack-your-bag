'use client';

import { BsBackpack } from 'react-icons/bs';
import { HiOutlineScale } from 'react-icons/hi2';
import { MdDeleteOutline, MdOutlineEdit, MdOutlineFormatListBulleted } from 'react-icons/md';

import { Button } from '@repo/react-common/button';
import { ColorTheme, colorThemes } from '@repo/react-common/color-themes';
import { CategoryPill, CategoryPillProps } from '@repo/react-common/pill';
import { ExpandableText } from '@repo/react-common/utils';

import classNames from 'classnames';

export interface CollectionDetailsCardProps {
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

export function CollectionDetailsCard(props: CollectionDetailsCardProps) {
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
  const Icon = type === 'list' ? MdOutlineFormatListBulleted : BsBackpack;

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <div
        className={classNames(
          'flex min-h-0 flex-1 flex-col rounded-md border shadow-sm',
          colorThemeClassName,
        )}
      >
        <div className="flex-none p-4">
          <div className="flex items-center gap-3">
            <div className="flex-none p-2">
              <Icon size={24} aria-hidden="true" />
            </div>
            <h2 className="text-xl">{name}</h2>
          </div>
          {description && (
            <div className="mt-4">
              <ExpandableText text={description} maxLines={3} />
            </div>
          )}
          <div className="mt-4 flex justify-between text-xs text-nowrap">
            <span>{`${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}</span>
            <span className="flex items-center gap-1">
              <HiOutlineScale className="h-3 w-3" aria-hidden="true" />
              {`${totalWeight}${weightUnit ? ` ${weightUnit}` : ''}`}
            </span>
          </div>
        </div>

        {categoryWeights && categoryWeights.length > 0 && (
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-2">
            <div className="flex flex-col gap-2">
              {[...categoryWeights]
                .sort((a, b) => a.category.name.localeCompare(b.category.name))
                .map(({ category, weight }) => (
                  <div key={category.name} className="flex items-center justify-between gap-2">
                    <div className="max-w-3/4">
                      <CategoryPill {...category} />
                    </div>
                    <span className="text-xs">{weight}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="flex flex-none justify-end gap-8 p-4">
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
