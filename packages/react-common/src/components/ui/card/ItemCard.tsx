import { HiOutlineScale } from 'react-icons/hi2';

import classNames from 'classnames';

import { CategoryPill, type CategoryPillProps } from '../pill/CategoryPill';
import { ExpandableText } from '../utils';

export interface ItemCardProps {
  name: string;
  description?: string;
  category: CategoryPillProps | null;
  weight?: string;
  weightUnit?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function ItemCard(props: ItemCardProps) {
  const { name, description, category, weight, weightUnit, actions, className } = props;

  return (
    <div
      className={classNames(
        'bg-surface border-primary-ring text-primary flex min-h-32 w-full flex-col justify-between gap-6 rounded-md border p-4 text-left shadow-sm',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-bold wrap-anywhere">{name}</h3>
        {category && <CategoryPill {...category} />}
      </div>
      {description && <ExpandableText text={description} />}
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-1 text-xs">
          <HiOutlineScale className="h-3 w-3" />
          {weight !== undefined && weight !== null
            ? `${weight}${weightUnit ? ` ${weightUnit}` : ''}`
            : '--'}
        </div>
        {actions}
      </div>
    </div>
  );
}
