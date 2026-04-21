import { useId } from 'react';

import classNames from 'classnames';

import { inputFieldClassName, inputLabelClassName, inputWrapperClassName } from './Input';

export interface InputTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  maxLength?: number;
  errorMessage?: string;
}

export function InputTextarea(props: InputTextareaProps) {
  const { className, label, maxLength, errorMessage, ...rest } = props;
  const errorId = useId();
  const valueLength = String(rest.value ?? '').length;
  const isValueLengthExceeded = maxLength && valueLength > maxLength;

  return (
    <label className={inputWrapperClassName}>
      <div className={inputLabelClassName}>
        <span>{label}</span>
        {maxLength && (
          <span className={isValueLengthExceeded ? 'text-danger' : ''}>
            {valueLength}/{maxLength}
          </span>
        )}
      </div>
      <textarea
        className={classNames(inputFieldClassName, className)}
        maxLength={maxLength}
        {...rest}
        aria-invalid={!!errorMessage}
        aria-describedby={errorMessage ? errorId : undefined}
      />
      {errorMessage && (
        <div id={errorId} className="text-danger text-xs">
          {errorMessage}
        </div>
      )}
    </label>
  );
}
