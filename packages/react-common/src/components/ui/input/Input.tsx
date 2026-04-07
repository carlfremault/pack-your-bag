import classNames from 'classnames';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
}

export const inputWrapperClassName = 'flex flex-col gap-1 p-2';
export const inputLabelClassName =
  'text-primary flex items-center gap-1 text-[10px] font-medium uppercase';
export const inputRequiredClassName = 'text-danger text-[10px] font-medium';
export const inputFieldClassName =
  'border-primary-ring bg-primary-foreground text-primary focus:ring-info-ring rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none';

export function Input(props: InputProps) {
  const { className, label, required = false, ...rest } = props;

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
      <input className={classNames(inputFieldClassName, className)} required={required} {...rest} />
    </label>
  );
}
