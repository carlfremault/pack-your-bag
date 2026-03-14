import classNames from 'classnames';

import { ButtonColor, ButtonSize } from '@/types/ui-types';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  color?: ButtonColor;
  size?: ButtonSize;
}

const buttonColor: Record<ButtonColor, string> = {
  primary: 'bg-blue-500',
  secondary: 'bg-green-500',
  danger: 'bg-red-500',
  transparent: 'bg-transparent',
};

const buttonSize: Record<ButtonSize, string> = {
  small: 'h-6 px-2 text-sm',
  medium: 'h-8 px-4 text-base',
  large: 'h-10 px-6 text-lg',
};

export default function Button(props: ButtonProps) {
  const {
    children,
    className,
    color = 'primary',
    size = 'medium',
    disabled = false,
    ...rest
  } = props;

  const buttonClassName = classNames(
    'rounded-md',
    buttonColor[color],
    buttonSize[size],
    disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
    color === 'transparent' ? 'text-current' : 'text-white',

    className,
  );

  return (
    <button className={buttonClassName} {...rest}>
      {children}
    </button>
  );
}
