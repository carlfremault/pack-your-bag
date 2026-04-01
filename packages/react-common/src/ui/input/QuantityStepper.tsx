import classNames from 'classnames';

export interface QuantityStepperProps {
  quantity: number;
  onChange: (quantity: number) => void;
  min?: number;
  max?: number;
}

export default function QuantityStepper(props: QuantityStepperProps) {
  const { quantity, onChange, min = 0, max = Infinity } = props;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (value >= min && value <= max && !isNaN(value)) {
      onChange(Number(value));
    }
  };

  const stepperButtonClassName =
    'bg-background text-primary ring-primary-ring flex h-6 w-6 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 active:scale-90 active:bg-primary/15 transition-[transform,background-color] duration-150 ease-out';
  const inputClassName =
    'text-primary text-sm ring-primary-ring h-6 w-12 rounded-md text-center [appearance:textfield] focus-visible:outline-none focus-visible:ring-2 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

  return (
    <div
      className="bg-info-ring flex w-fit items-center gap-2 rounded-md p-1"
      role="group"
      aria-label="Quantity"
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => onChange(Math.max(min, quantity - 1))}
        disabled={quantity <= min}
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
      />
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(Math.min(max, quantity + 1))}
        disabled={quantity >= max}
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
