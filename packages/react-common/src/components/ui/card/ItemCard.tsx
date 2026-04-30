import { HiOutlineScale } from 'react-icons/hi2';
import { MdDeleteOutline, MdOutlineEdit } from 'react-icons/md';

import classNames from 'classnames';

import { Button } from '../button/Button';
import { CategoryPill, type CategoryPillProps } from '../pill/CategoryPill';
import { ExpandableText } from '../utils';

export interface ItemCardProps {
  id: string;
  name: string;
  description?: string;
  category: CategoryPillProps | null;
  weight?: string;
  weightUnit?: string;
  onEditItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
  actions?: React.ReactNode;
  className?: string;
}

export function ItemCard(props: ItemCardProps) {
  const {
    id,
    name,
    description,
    category,
    weight,
    weightUnit,
    onEditItem,
    onDeleteItem,
    actions,
    className,
  } = props;

  return (
    <div
      className={classNames(
        'bg-surface border-primary-ring text-primary flex min-h-24 w-full items-start justify-between gap-2 rounded-md border p-3 text-left shadow-sm',
        className,
      )}
    >
      <div className="flex h-full w-full min-w-0 flex-1 flex-col justify-between gap-4">
        <div className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-center">
          <h3 className="text-sm font-bold wrap-anywhere">{name}</h3>
          {category && <CategoryPill {...category} />}
        </div>
        {description && (
          <div className="text-xs font-light">
            <ExpandableText text={description} />
          </div>
        )}
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
      <div className="flex h-full flex-col justify-between">
        <Button
          variant="unstyledIcon"
          color="primary"
          aria-label={`Edit ${name}`}
          onClick={() => onEditItem(id)}
        >
          <MdOutlineEdit className="h-5 w-5" />
        </Button>
        <Button
          variant="unstyledIcon"
          color="danger"
          aria-label={`Delete ${name}`}
          onClick={() => onDeleteItem(id)}
        >
          <MdDeleteOutline className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
