import { useState } from 'react';

import classNames from 'classnames';

import {
  inputFieldClassName,
  inputLabelClassName,
  inputRequiredClassName,
  inputWrapperClassName,
} from './Input';

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  required?: boolean;
  defaultVisible?: boolean;
}

export function PasswordInput(props: PasswordInputProps) {
  const { className, label, required = false, defaultVisible = false, ...rest } = props;
  const [isVisible, setIsVisible] = useState(defaultVisible);

  return (
    <label className={inputWrapperClassName}>
      <span className={inputLabelClassName}>
        {label} {required && <span className={inputRequiredClassName}>*</span>}
      </span>
      <div
        className={classNames(inputFieldClassName, className, 'flex items-center justify-between')}
      >
        <input {...rest} type={isVisible ? 'text' : 'password'} className="flex-1" />
        <button
          type="button"
          onClick={() => setIsVisible((current) => !current)}
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          aria-pressed={isVisible}
          className="cursor-pointer text-xs font-medium"
        >
          {isVisible ? 'Hide' : 'Show'}
        </button>
      </div>
    </label>
  );
}
