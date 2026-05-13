import { HiOutlineScale } from 'react-icons/hi2';
import { MdCheckCircleOutline, MdOutlineCircle } from 'react-icons/md';

import { CategoryPill, CategoryPillProps } from '../pill/CategoryPill';

export interface TripItemCardProps {
  name: string;
  category: CategoryPillProps | null;
  quantity: number;
  packedQuantity: number;
  displayWeight: string | null;
  displayUnit: string | null;
  actions?: React.ReactNode;
}

export function TripItemCard(props: TripItemCardProps) {
  const { name, category, quantity, packedQuantity, displayWeight, displayUnit, actions } = props;

  const fullyPacked = packedQuantity === quantity;

  return (
    <div className="bg-surface text-primary border-primary-ring flex w-full items-center justify-between gap-3 rounded-md border p-3 text-left shadow-sm">
      <span
        className="flex items-center"
        role="img"
        aria-label={fullyPacked ? 'Fully packed' : 'Not fully packed'}
      >
        {fullyPacked ? (
          <MdCheckCircleOutline className="text-success h-5 w-5 shrink-0" aria-hidden />
        ) : (
          <MdOutlineCircle className="h-5 w-5 shrink-0" aria-hidden />
        )}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {category && <CategoryPill {...category} />}
        <h3 className="text-sm font-bold wrap-break-word">{name}</h3>
        <div className="flex items-center gap-1 text-xs">
          <HiOutlineScale className="h-3 w-3" />
          {displayWeight !== undefined && displayWeight !== null
            ? `${displayWeight}${displayUnit ? ` ${displayUnit}` : ''}`
            : '--'}
        </div>
      </div>
      <div className="text-xs font-bold">{`${packedQuantity} / ${quantity}`}</div>
      {actions}
    </div>
  );
}
