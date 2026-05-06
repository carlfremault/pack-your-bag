import classNames from 'classnames';

export type QuantityType = 'item' | 'list';

export interface QuantityStepperProps {
  id: string;
  type: QuantityType;
  quantity: number;
  onChange: (id: string, quantity: number, type: QuantityType) => void;
  min?: number;
  max?: number;
  groupAriaLabel?: string;
  disabled?: boolean;
}

export function QuantityStepper(props: QuantityStepperProps) {
  const {
    id,
    type,
    quantity,
    onChange,
    min = 0,
    max = Infinity,
    groupAriaLabel = 'Quantity',
    disabled,
  } = props;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (value >= min && value <= max && !isNaN(value)) {
      onChange(id, value, type);
    }
  };

  const stepperButtonClassName =
    'bg-surface text-primary ring-primary-ring flex h-6 w-6 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 active:scale-90 active:bg-primary/15 transition-[transform,background-color] duration-150 ease-out';
  const inputClassName =
    'text-primary text-sm ring-primary-ring h-6 w-8 rounded-md text-center [appearance:textfield] focus-visible:outline-none focus-visible:ring-2 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

  return (
    <div
      className="bg-surface-overlay flex w-fit items-center gap-2 rounded-md p-1"
      role="group"
      aria-label={groupAriaLabel}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => onChange(id, Math.max(min, quantity - 1), type)}
        disabled={quantity <= min || disabled}
        className={classNames(
          stepperButtonClassName,
          quantity <= min ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        )}
      >
        -
      </button>
      <input
        type="number"
        aria-label="Quantity value"
        value={quantity}
        onChange={handleChange}
        className={inputClassName}
        disabled={disabled}
      />
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(id, Math.min(max, quantity + 1), type)}
        disabled={quantity >= max || disabled}
        className={classNames(
          stepperButtonClassName,
          quantity >= max ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        )}
      >
        +
      </button>
    </div>
  );
}
