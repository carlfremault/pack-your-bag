import { useId } from 'react';

import classNames from 'classnames';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  errorMessage?: string;
}

export const inputWrapperClassName = 'flex flex-col gap-1';
export const inputLabelClassName =
  'text-primary flex items-center gap-1 text-[10px] font-medium uppercase';
export const inputRequiredClassName = 'text-danger text-[10px] font-medium';
export const inputFieldClassName =
  'border-primary-ring bg-primary-foreground text-primary focus:ring-info-ring rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none';

export function Input(props: InputProps) {
  const { className, label, required = false, errorMessage, ...rest } = props;
  const errorId = useId();

  return (
    <label className={inputWrapperClassName}>
      <span className={inputLabelClassName}>
        {label}
        {required && (
          <span className={inputRequiredClassName} aria-hidden="true">
            *
          </span>
        )}
        {required && <span className="sr-only">(required)</span>}
      </span>
      <input
        className={classNames(inputFieldClassName, className)}
        required={required}
        aria-invalid={!!errorMessage}
        aria-describedby={errorMessage ? errorId : undefined}
        {...rest}
      />
      {errorMessage && (
        <div id={errorId} className="text-danger text-xs">
          {errorMessage}
        </div>
      )}
    </label>
  );
}
