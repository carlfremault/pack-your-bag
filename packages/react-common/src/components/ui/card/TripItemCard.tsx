import { MdCheckCircleOutline, MdOutlineCircle } from 'react-icons/md';

import { QuantityStepper } from '../input/QuantityStepper';
import { CategoryPill, CategoryPillProps } from '../pill/CategoryPill';

export interface TripItemCardProps {
  itemId: string;
  itemName: string;
  itemCategory: CategoryPillProps | null;
  quantityNeeded: number;
  quantityPacked: number;
  onQuantityPackedChange: (id: string, quantity: number) => void;
}

export function TripItemCard(props: TripItemCardProps) {
  const { itemId, itemName, itemCategory, quantityNeeded, quantityPacked, onQuantityPackedChange } =
    props;

  const handleQuantityChange = (quantity: number) => onQuantityPackedChange(itemId, quantity);

  const fullyPacked = quantityPacked === quantityNeeded;

  return (
    <div className="bg-surface text-primary border-primary-ring flex w-full items-center justify-between gap-3 rounded-md border p-3 text-left shadow-sm">
      <span className="flex shrink-0 items-center">
        {fullyPacked ? (
          <MdCheckCircleOutline className="text-success h-5 w-5 shrink-0" aria-hidden />
        ) : (
          <MdOutlineCircle className="h-5 w-5 shrink-0" aria-hidden />
        )}
        <span className="sr-only">{fullyPacked ? 'Fully packed' : 'Not fully packed'}</span>
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="text-sm font-bold">{itemName}</h3>
        <div className="text-xs font-light">Need: {quantityNeeded}</div>
      </div>
      {itemCategory && <CategoryPill {...itemCategory} />}
      <div className="text-xs font-bold">{`${quantityPacked} / ${quantityNeeded}`}</div>
      <div>
        <QuantityStepper
          quantity={quantityPacked}
          onChange={handleQuantityChange}
          min={0}
          max={quantityNeeded}
          groupAriaLabel={`Packed quantity for ${itemName}`}
        />
      </div>
    </div>
  );
}
