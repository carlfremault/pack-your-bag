import classNames from 'classnames';

type SpinnerSize = 'small' | 'medium' | 'large';
type SpinnerColor = 'primary' | 'surface';

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: SpinnerSize;
  color?: SpinnerColor;
  label?: string;
}

const spinnerSizeClass: Record<SpinnerSize, string> = {
  small: 'h-4 w-4 border-2',
  medium: 'h-6 w-6 border-2',
  large: 'h-8 w-8 border-[3px]',
};

const spinnerColorClass: Record<SpinnerColor, string> = {
  primary: 'border-primary border-t-transparent',
  surface: 'border-surface border-t-transparent',
};

export function Spinner(props: SpinnerProps) {
  const { className, size = 'medium', color = 'primary', label = 'Loading', ...rest } = props;

  const spinnerClassName = classNames(
    'inline-block box-border animate-spin rounded-full',
    spinnerSizeClass[size],
    spinnerColorClass[color],
    className,
  );

  return (
    <div aria-live="polite" role="status" {...rest}>
      <span className={spinnerClassName} aria-hidden />
      <span className="sr-only">{label}</span>
    </div>
  );
}
