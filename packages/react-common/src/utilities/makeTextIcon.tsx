import { ComponentType } from 'react';

import classNames from 'classnames';

export function makeTextIcon(text: string): ComponentType<{ className?: string }> {
  function TextIcon({ className }: { className?: string }) {
    return (
      <span
        aria-hidden="true"
        className={classNames(
          className,
          'inline-flex h-5 w-auto! items-center justify-center px-1 font-mono text-[10px] leading-none font-bold whitespace-nowrap',
        )}
      >
        {text}
      </span>
    );
  }
  TextIcon.displayName = `TextIcon(${text})`;
  return TextIcon;
}
