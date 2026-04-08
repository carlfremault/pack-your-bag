import type { ButtonColor, ButtonSize, ButtonVariant } from './button-styles';
import { getButtonClassName } from './button-styles';

type LinkButtonOwnProps<T extends React.ElementType = 'a'> = {
  children: React.ReactNode;
  href: string;
  color?: ButtonColor;
  size?: ButtonSize;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  linkAs?: T;
  className?: string;
};

export type LinkButtonProps<T extends React.ElementType = 'a'> = LinkButtonOwnProps<T> &
  Omit<React.ComponentPropsWithoutRef<T>, keyof LinkButtonOwnProps<T>>;

export function LinkButton<T extends React.ElementType = 'a'>(props: LinkButtonProps<T>) {
  const {
    children,
    href,
    color = 'primary',
    size = 'medium',
    variant = 'outline',
    fullWidth = false,
    linkAs: LinkComponent = 'a',
    className,
    ...rest
  } = props;

  const linkClassName = getButtonClassName({ variant, color, size, fullWidth, className });

  return (
    <LinkComponent href={href} className={linkClassName} {...rest}>
      {children}
    </LinkComponent>
  );
}
