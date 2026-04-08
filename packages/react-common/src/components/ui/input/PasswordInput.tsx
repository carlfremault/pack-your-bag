'use client';

import { useId, useState } from 'react';

import classNames from 'classnames';

import { inputLabelClassName, inputRequiredClassName, inputWrapperClassName } from './Input';

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  required?: boolean;
  defaultVisible?: boolean;
  errorMessage?: string;
}

export function PasswordInput(props: PasswordInputProps) {
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

  const passwordInputContainerClassName =
    'border-primary-ring bg-primary-foreground rounded-md border px-3 py-2 text-sm flex items-center justify-between focus-within:ring-info-ring focus-within:ring-2';

  return (
    <label className={inputWrapperClassName}>
      <span className={inputLabelClassName}>
        {label} {required && <span className={inputRequiredClassName}>*</span>}
      </span>
      <div className={classNames(passwordInputContainerClassName, className)}>
        <input
          className="flex-1 border-0 bg-transparent outline-none focus:ring-0 focus:outline-none"
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
          className="cursor-pointer text-xs font-medium outline-none focus-visible:underline"
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
