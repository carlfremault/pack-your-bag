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
  handleEditItem: (id: string) => void;
  actions?: React.ReactNode;
}

export default function ItemCard(props: ItemCardProps) {
  const { id, name, description, category, weight, weightUnit, handleEditItem, actions } = props;

  return (
    <div className="bg-background border-primary-ring flex w-full items-start justify-between rounded-xl border p-3 text-left shadow-sm transition-all">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="text-primary truncate text-base font-bold">{name}</h3>
          {category && <CategoryPill {...category} />}
        </div>
        {description && <div className="text-primary/70 mr-2 text-xs">{description}</div>}
        <div className="text-primary flex items-center gap-1 text-xs">
          <HiOutlineScale className="h-3 w-3" />{' '}
          {weight !== undefined && weight !== null
            ? `${weight}${weightUnit ? ` ${weightUnit}` : ''}`
            : '--'}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-center justify-between gap-2 self-stretch">
        <Button
          variant="unstyledIcon"
          color="primary"
          aria-label={`Edit ${name}`}
          onClick={() => handleEditItem(id)}
        >
          <MdOutlineEdit className="h-5 w-5" />
        </Button>
        {actions}
      </div>
    </div>
  );
}
