'use client';

import { BsBackpack } from 'react-icons/bs';
import { HiOutlineScale } from 'react-icons/hi2';
import { MdCheckCircleOutline, MdHiking, MdOutlineCircle } from 'react-icons/md';
import { MdDeleteOutline, MdOutlineEdit } from 'react-icons/md';

import { Button } from '@repo/react-common/button';
import { CategoryPill, CategoryPillProps } from '@repo/react-common/pill';
import { ExpandableText } from '@repo/react-common/utils';

import classNames from 'classnames';

import { getColorThemeClassName } from '../../../utilities';

export interface TripDetailsCardProps {
  id: string;
  name: string;
  date?: string;
  remarks?: string;
  packName?: string;
  packColorTheme?: string;
  numberOfItems: number;
  numberOfItemsPacked: number;
  totalWeight: string;
  weightUnit?: string;
  categoryItems?: {
    category: CategoryPillProps;
    itemsNeeded: number;
    itemsPacked: number;
  }[];
  onEditTrip: (id: string) => void;
  onDeleteTrip: (id: string) => void;
}

export function TripDetailsCard(props: TripDetailsCardProps) {
  const {
    id,
    name,
    date,
    remarks,
    packName,
    packColorTheme,
    numberOfItems,
    numberOfItemsPacked,
    totalWeight,
    weightUnit,
    categoryItems,
    onEditTrip,
    onDeleteTrip,
  } = props;

  const percentagePacked =
    numberOfItems > 0 ? Math.round((numberOfItemsPacked / numberOfItems) * 100) : 0;
  const clampedPercentage = Math.min(100, Math.max(0, percentagePacked));

  const colorThemeClassName = getColorThemeClassName(packColorTheme);
  const packNameClassName = classNames(
    'rounded-xl border px-2 py-1 text-xs font-medium',
    'w-fit max-w-full wrap-break-word whitespace-normal',
    colorThemeClassName,
  );
  const progressBarColorClassName = clampedPercentage === 100 ? 'bg-success' : 'bg-accent';
  const percentagePackedColorClassName =
    clampedPercentage === 100 ? 'text-success' : 'text-accent-emphasis';

  return (
    <div className="bg-surface border-primary-ring text-primary flex min-h-0 flex-col gap-6 rounded-md border p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2">
          <div className="flex-none px-2">
            <MdHiking size={32} aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-xl">{name}</h2>
            {date && <div className="text-[10px] font-medium text-nowrap">{date}</div>}
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className={classNames(percentagePackedColorClassName, 'text-lg font-bold')}>
            {percentagePacked}%
          </div>
          <div
            className={classNames(
              percentagePackedColorClassName,
              'text-[10px] font-bold uppercase',
            )}
          >
            ready
          </div>
        </div>
      </div>

      <div className="bg-accent-ring h-2 w-full rounded-full">
        <div
          className={classNames(progressBarColorClassName, 'h-full rounded-full')}
          style={{ width: `${clampedPercentage}%` }}
          role="progressbar"
          aria-valuenow={clampedPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Packing progress"
        ></div>
      </div>

      <div className="flex items-center justify-between">
        <div
          className={classNames(
            'me-2 flex min-w-0 flex-row items-center justify-start gap-2 text-xs',
            packName && packNameClassName,
          )}
        >
          <BsBackpack className="min-h-4 min-w-4" aria-hidden="true" />
          {packName ?? '--'}
        </div>
        <div className="flex flex-col items-end gap-2 text-xs text-nowrap">
          <span>{`${numberOfItems} ${numberOfItems === 1 ? 'item' : 'items'}`}</span>
          <span className="flex items-center gap-1">
            <HiOutlineScale className="h-3 w-3" aria-hidden="true" />
            {`${totalWeight}${weightUnit ? ` ${weightUnit}` : ''}`}
          </span>
        </div>
      </div>

      {categoryItems && categoryItems.length > 0 && (
        <div className="min-h-0 flex-1 overflow-y-auto pb-2">
          <div className="flex flex-col gap-2">
            {[...categoryItems]
              .sort((a, b) => a.category.name.localeCompare(b.category.name))
              .map(({ category, itemsNeeded, itemsPacked }) => (
                <div key={category.name} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {itemsNeeded === itemsPacked ? (
                      <>
                        <MdCheckCircleOutline
                          className="text-success h-5 w-5 shrink-0"
                          aria-hidden="true"
                        />
                        <span className="sr-only">Fully packed</span>
                      </>
                    ) : (
                      <>
                        <MdOutlineCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
                        <span className="sr-only">Not fully packed</span>
                      </>
                    )}
                    <div className="max-w-3/4">
                      <CategoryPill {...category} />
                    </div>
                  </div>
                  <div
                    className={classNames(
                      'flex items-center gap-1 text-xs',
                      itemsNeeded === itemsPacked && 'text-success',
                    )}
                  >
                    <span>{itemsPacked}</span>
                    <span>/</span>
                    <span>{itemsNeeded}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {remarks && (
        <div className="mt-4">
          <ExpandableText text={remarks} maxLines={3} />
        </div>
      )}

      <div className="flex flex-none justify-end gap-8">
        <Button
          variant="unstyledIcon"
          color="primary"
          aria-label={`Edit ${name}`}
          onClick={() => onEditTrip(id)}
        >
          <MdOutlineEdit className="h-6 w-6" aria-hidden="true" />
        </Button>
        <Button
          variant="unstyledIcon"
          color="danger"
          aria-label={`Delete ${name}`}
          onClick={() => onDeleteTrip(id)}
        >
          <MdDeleteOutline className="h-6 w-6" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
