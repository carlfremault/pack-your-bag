import { useId } from 'react';

import classNames from 'classnames';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  maxLength?: number;
  errorMessage?: string;
}

export const inputWrapperClassName = 'flex flex-col gap-1';
export const inputLabelClassName =
  'text-primary flex items-center gap-1 text-[10px] font-medium uppercase justify-between';
export const inputRequiredClassName = 'text-danger text-[10px] font-medium';
export const inputFieldClassName =
  'border-primary-ring bg-primary-foreground text-primary focus:ring-info-ring rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none';

export function Input(props: InputProps) {
  const { className, label, required = false, maxLength, errorMessage, ...rest } = props;
  const errorId = useId();
  const valueLength = String(rest.value ?? '').length;
  const isValueLengthExceeded = maxLength && valueLength > maxLength;

  return (
    <label className={inputWrapperClassName}>
      <div className={inputLabelClassName}>
        <span>
          {label}
          {required && (
            <span className={inputRequiredClassName} aria-hidden="true">
              *
            </span>
          )}
        </span>
        {maxLength && (
          <span
            aria-live="polite"
            aria-atomic="true"
            className={isValueLengthExceeded ? 'text-danger' : ''}
          >
            {valueLength}/{maxLength}
            {isValueLengthExceeded && <span className="sr-only"> - character limit exceeded</span>}
          </span>
        )}

        {required && <span className="sr-only">(required)</span>}
      </div>
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
