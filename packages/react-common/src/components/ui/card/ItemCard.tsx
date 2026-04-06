import { HiOutlineScale } from 'react-icons/hi2';
import { MdOutlineEdit } from 'react-icons/md';

import Button from '../button/Button';
import CategoryPill, { CategoryPillProps } from '../pill/CategoryPill';

export interface ItemCardProps {
  id: string;
  name: string;
  description?: string;
  category?: CategoryPillProps;
  weight?: number;
  weightUnit?: string;
  onEditItem: (id: string) => void;
  actions?: React.ReactNode;
}

export default function ItemCard(props: ItemCardProps) {
  const { id, name, description, category, weight, weightUnit, onEditItem, actions } = props;

  return (
    <div className="bg-surface border-primary-ring text-primary flex w-full flex-col items-start justify-between gap-2 rounded-md border p-3 text-left shadow-sm">
      <div className="flex w-full items-center justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-bold">{name}</h3>
            {category && <CategoryPill {...category} />}
          </div>
        </div>
        <Button
          variant="unstyledIcon"
          color="primary"
          aria-label={`Edit ${name}`}
          onClick={() => onEditItem(id)}
        >
          <MdOutlineEdit className="h-5 w-5" />
        </Button>
      </div>
      {description && <div className="text-xs font-light">{description}</div>}
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
