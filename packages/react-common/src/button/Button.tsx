import classNames from 'classnames';

export type ButtonColor = 'primary' | 'outline' | 'warning' | 'danger' | 'transparent';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  color?: ButtonColor;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const buttonColor: Record<ButtonColor, string> = {
  primary: 'bg-primary ring-primary-ring text-primary-foreground',
  outline:
    'bg-background text-secondary ring-secondary-ring border border-secondary hover:bg-secondary/10',
  warning: 'bg-warning ring-warning-ring text-warning-foreground',
  danger: 'bg-danger ring-danger-ring text-danger-foreground',
  transparent: 'bg-transparent ring-foreground/80 hover:bg-foreground/5 text-primary',
};

const buttonSize: Record<ButtonSize, string> = {
  small: 'h-11 px-3 text-sm',
  medium: 'h-11 px-5 text-base',
  large: 'h-12 px-7 text-lg',
};

export default function Button(props: ButtonProps) {
  const {
    children,
    className,
    color = 'primary',
    size = 'medium',
    disabled = false,
    fullWidth = false,
    type = 'button',
    ...rest
  } = props;

  if (
    process.env.NODE_ENV !== 'production' &&
    typeof children !== 'string' &&
    !rest['aria-label'] &&
    !rest['aria-labelledby']
  ) {
    // Guard against unnamed icon-only buttons in development.
    console.warn('Button: add aria-label or aria-labelledby when using non-text children.');
  }

  const buttonClassName = classNames(
    'rounded-md flex items-center justify-center transition-[filter,transform,box-shadow] duration-150 ease-out focus-visible:outline-none shadow-sm font-medium tracking-wide focus-visible:ring-2 ',
    buttonColor[color],
    buttonSize[size],
    disabled
      ? 'cursor-not-allowed opacity-50'
      : 'cursor-pointer active:shadow-none active:scale-[0.99] active:brightness-95',
    !disabled && color !== 'transparent' && color !== 'outline' && 'hover:brightness-110',
    fullWidth ? 'w-full' : 'w-fit',
    className,
  );

  return (
    <button className={buttonClassName} disabled={disabled} type={type} {...rest}>
      {children}
    </button>
  );
}
