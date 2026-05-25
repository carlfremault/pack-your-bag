'use client';

import { useId, useState } from 'react';

import classNames from 'classnames';

import { inputRequiredClassName, inputWrapperClassName } from './Input';

export interface InputPasswordProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  required?: boolean;
  defaultVisible?: boolean;
  errorMessage?: string;
}

const inputPasswordContainerClassName =
  'border-primary-ring bg-primary-foreground rounded-md border px-3 py-2 text-sm flex items-center justify-between focus-within:ring-info-ring focus-within:ring-2 focus-within:outline-none';

export function InputPassword(props: InputPasswordProps) {
  const {
    className,
    label,
    required = false,
    defaultVisible = false,
    errorMessage,
    ...rest
  } = props;
  const [isVisible, setIsVisible] = useState(defaultVisible);
  const errorId = useId();

  return (
    <label className={classNames(inputWrapperClassName)}>
      <span className="text-primary flex items-center gap-1 text-[10px] font-medium uppercase">
        {label} {required && <span className={inputRequiredClassName}>*</span>}
      </span>
      <div className={classNames(inputPasswordContainerClassName, className)}>
        <input
          className={classNames('min-w-0 flex-1 border-0 bg-transparent outline-none')}
          type={isVisible ? 'text' : 'password'}
          required={required}
          aria-invalid={!!errorMessage}
          aria-describedby={errorMessage ? errorId : undefined}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setIsVisible((current) => !current)}
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          aria-pressed={isVisible}
          className="text-primary cursor-pointer text-xs font-medium outline-none focus-visible:underline"
        >
          {isVisible ? 'Hide' : 'Show'}
        </button>
      </div>
      {errorMessage && (
        <div id={errorId} className="text-danger text-xs">
          {errorMessage}
        </div>
      )}
    </label>
  );
}
