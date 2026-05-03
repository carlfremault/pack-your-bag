import classNames from 'classnames';

export interface ToggleOption<T> {
  value: T;
  label: string;
}

export interface InputToggleProps<T> {
  options: readonly ToggleOption<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  ariaLabel?: string;
}

export function InputToggle<T extends string>(props: InputToggleProps<T>) {
  const { options, value, onChange, ariaLabel } = props;

  const baseClassName =
    'cursor-pointer active:scale-90 active:bg-primary/10 transition-all duration-150 ease-out flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium tracking-wide focus-visible:ring-primary-ring focus-visible:ring-2 focus-visible:outline-none';
  const activeClassName = 'bg-surface text-primary shadow-sm dark:bg-primary/20';
  const inactiveClassName = 'text-nav-inactive hover:text-nav-inactive-hover';

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="bg-surface-overlay flex w-fit rounded-md p-1"
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={classNames(baseClassName, isActive ? activeClassName : inactiveClassName)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
