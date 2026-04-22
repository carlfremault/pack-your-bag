import { useId } from 'react';

import classNames from 'classnames';

import { inputLabelClassName, inputWrapperClassName } from './Input';

export interface IconToggleOption<T extends string = string> {
  value: T;
  icon: React.ElementType;
  label: string;
}

export interface InputIconToggleProps<T extends string = string> {
  label: string;
  options: IconToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

const buttonBase =
  'cursor-pointer active:scale-90 active:bg-primary/10 transition-all duration-150 ease-out flex items-center justify-center rounded-md p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-ring';
const activeClass = 'bg-surface text-primary shadow-sm';
const inactiveClass = 'text-nav-inactive hover:text-nav-inactive-hover';

export function InputIconToggle<T extends string = string>({
  label,
  options,
  value,
  onChange,
}: InputIconToggleProps<T>) {
  const labelId = useId();

  return (
    <div className={inputWrapperClassName}>
      <div className={inputLabelClassName}>
        <span id={labelId}>{label}</span>
      </div>
      <div
        role="group"
        aria-labelledby={labelId}
        className="bg-surface-overlay flex w-fit rounded-md p-1"
      >
        {options.map((option) => {
          const isActive = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              aria-label={option.label}
              aria-pressed={isActive}
              onClick={() => onChange(option.value)}
              className={classNames(buttonBase, isActive ? activeClass : inactiveClass)}
            >
              <option.icon className="h-5 w-5" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
