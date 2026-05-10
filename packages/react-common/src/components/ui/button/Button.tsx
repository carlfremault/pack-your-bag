import type { ButtonColor, ButtonSize, ButtonVariant } from './button-styles';
import { getButtonClassName } from './button-styles';

export type { ButtonColor, ButtonSize, ButtonVariant };

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  color?: ButtonColor;
  size?: ButtonSize;
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

export function Button(props: ButtonProps) {
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

  const buttonClassName = getButtonClassName({
    variant,
    color,
    size,
    disabled,
    fullWidth,
    className,
  });

  return (
    <button className={buttonClassName} disabled={disabled} type={type} {...rest}>
      {children}
    </button>
  );
}
