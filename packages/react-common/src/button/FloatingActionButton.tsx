import { MdAdd } from 'react-icons/md';

import classNames from 'classnames';

interface FloatingActionButtonProps {
  onClick: () => void;
  ariaLabel?: string;
  className?: string;
}

export default function FloatingActionButton(props: FloatingActionButtonProps) {
  const { onClick, ariaLabel, className } = props;

  const buttonClassName = classNames(
    'absolute right-4 bottom-20 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-shadow-fab active:scale-95 transition-[filter,transform,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2',
    className,
  );

  return (
    <button
      type="button"
      onClick={onClick}
      className={buttonClassName}
      aria-label={ariaLabel ?? 'Add'}
    >
      <MdAdd className="h-8 w-8" />
    </button>
  );
}
