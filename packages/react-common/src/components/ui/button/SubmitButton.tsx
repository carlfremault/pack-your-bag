import { Spinner } from '../spinner/Spinner';

import { Button } from './Button';
import type { ButtonColor } from './button-styles';

export interface SubmitButtonProps {
  pending: boolean;
  color?: ButtonColor;
  children: React.ReactNode;
  ariaLabel?: string;
  className?: string;
}

export function SubmitButton(props: SubmitButtonProps) {
  const { pending, color = 'primary', children, ariaLabel, className } = props;

  const buttonAriaLabel =
    ariaLabel ??
    (typeof children === 'string' || typeof children === 'number' ? String(children) : undefined);

  return (
    <Button
      type="submit"
      color={color}
      disabled={pending}
      aria-label={buttonAriaLabel}
      className={className}
    >
      <span className="relative inline-flex items-center justify-center leading-none">
        <span className={`inline-flex items-center ${pending ? 'invisible' : ''}`}>{children}</span>
        {pending && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Spinner size="small" color="surface" className="translate-y-px" />
          </span>
        )}
      </span>
    </Button>
  );
}
