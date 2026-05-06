'use client';

import { useLayoutEffect, useRef, useState } from 'react';

import classNames from 'classnames';

export interface QuantityStepperProps {
  quantity: number;
  onChange: (quantity: number) => void;

  min?: number;
  max?: number;
  groupAriaLabel?: string;
  disabled?: boolean;
}

export function QuantityStepper(props: QuantityStepperProps) {
  const {
    quantity,
    onChange,
    min = 0,
    max = Infinity,
    groupAriaLabel = 'Quantity',
    disabled,
  } = props;

  const [localQuantity, setLocalQuantity] = useState(quantity);
  const latestQuantity = useRef(quantity);

  // Syncs display state and the rapid-click ref when the server confirms a different value
  // than what the user set (e.g. server-side validation). useLayoutEffect fires before paint
  // so there is no visible intermediate render — the "cascading render" warning does not apply.
  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalQuantity(quantity);
    latestQuantity.current = quantity;
  }, [quantity]);

  const handleDecrement = () => {
    const next = Math.max(min, latestQuantity.current - 1);
    latestQuantity.current = next;
    setLocalQuantity(next);
    onChange(next);
  };

  const handleIncrement = () => {
    const next = Math.min(max, latestQuantity.current + 1);
    latestQuantity.current = next;
    setLocalQuantity(next);
    onChange(next);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (value >= min && value <= max && !isNaN(value)) {
      latestQuantity.current = value;
      setLocalQuantity(value);
      onChange(value);
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
        onClick={handleDecrement}
        disabled={localQuantity <= min || disabled}
        className={classNames(
          stepperButtonClassName,
          localQuantity <= min ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        )}
      >
        -
      </button>
      <input
        type="number"
        aria-label="Quantity value"
        value={localQuantity}
        onChange={handleChange}
        className={inputClassName}
        disabled={disabled}
      />
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={handleIncrement}
        disabled={localQuantity >= max || disabled}
        className={classNames(
          stepperButtonClassName,
          localQuantity >= max ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        )}
      >
        +
      </button>
    </div>
  );
}
