import classNames from 'classnames';

export type ButtonColor = 'primary' | 'secondary' | 'info' | 'warning' | 'danger';
export type ButtonSize = 'small' | 'medium' | 'large';
export type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'link' | 'unstyledIcon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  color?: ButtonColor;
  size?: ButtonSize;
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

const colorVariant: Record<ButtonVariant, Record<ButtonColor, string>> = {
  solid: {
    primary: 'bg-primary text-primary-foreground ring-primary-ring',
    secondary: 'bg-secondary text-secondary-foreground ring-secondary-ring',
    info: 'bg-info text-info-foreground ring-info-ring',
    warning: 'bg-warning text-warning-foreground ring-warning-ring',
    danger: 'bg-danger text-danger-foreground ring-danger-ring',
  },
  outline: {
    primary:
      'bg-background border border-primary text-primary ring-primary-ring hover:bg-primary/10',
    secondary:
      'bg-background border border-secondary-emphasis text-secondary-emphasis ring-secondary-ring hover:bg-secondary/10',
    info: 'bg-background border border-info text-info ring-info-ring hover:bg-info/10',
    warning:
      'bg-background border border-warning text-warning ring-warning-ring hover:bg-warning/10',
    danger: 'bg-background border border-danger text-danger ring-danger-ring hover:bg-danger/10',
  },
  ghost: {
    primary: 'text-primary ring-primary-ring hover:bg-primary/10',
    secondary: 'text-secondary-emphasis ring-secondary-ring hover:bg-secondary/10',
    info: 'text-info ring-info-ring hover:bg-info/10',
    warning: 'text-warning ring-warning-ring hover:bg-warning/10',
    danger: 'text-danger ring-danger-ring hover:bg-danger/10',
  },
  link: {
    primary: 'text-primary ring-primary-ring underline-offset-4 hover:underline',
    secondary: 'text-secondary-emphasis ring-secondary-ring underline-offset-4 hover:underline',
    info: 'text-info ring-info-ring underline-offset-4 hover:underline',
    warning: 'text-warning ring-warning-ring underline-offset-4 hover:underline',
    danger: 'text-danger ring-danger-ring underline-offset-4 hover:underline',
  },
  unstyledIcon: {
    primary: 'text-primary/80 hover:text-primary ring-primary-ring',
    secondary: 'text-secondary-emphasis/80 hover:text-secondary-emphasis ring-secondary-ring',
    info: 'text-info/80 hover:text-info ring-info-ring',
    warning: 'text-warning/80 hover:text-warning ring-warning-ring',
    danger: 'text-danger/80 hover:text-danger ring-danger-ring',
  },
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
    variant = 'solid',
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

  const isLink = variant === 'link';
  const isSolid = variant === 'solid';
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';
  const isUnstyledIcon = variant === 'unstyledIcon';

  const buttonClassName = classNames(
    'inline-flex items-center justify-center font-medium tracking-wide',
    'transition-[filter,transform,box-shadow,color] duration-150 ease-out',
    'focus-visible:outline-none focus-visible:ring-2',
    colorVariant[variant][color],
    !isLink && !isUnstyledIcon && buttonSize[size],
    !isLink && 'rounded-md',
    !isLink && !isGhost && !isOutline && !isUnstyledIcon && 'shadow-sm',
    isSolid && !disabled && 'hover:brightness-110',
    disabled
      ? 'cursor-not-allowed opacity-50'
      : classNames(
          'cursor-pointer',
          isUnstyledIcon
            ? 'active:scale-90 active:brightness-90'
            : 'active:scale-95 active:brightness-95',
        ),
    fullWidth ? 'w-full' : 'w-fit',
    className,
  );

  return (
    <button className={buttonClassName} disabled={disabled} type={type} {...rest}>
      {children}
    </button>
  );
}
