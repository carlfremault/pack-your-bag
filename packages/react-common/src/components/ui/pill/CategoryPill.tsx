import classNames from 'classnames';

import { type ColorTheme, colorThemes } from '#lib/colorThemes';

const DEFAULT_THEME: ColorTheme = 'slate';

export interface CategoryPillProps {
  name: string;
  colorTheme?: ColorTheme;
}

export function CategoryPill({ name, colorTheme }: CategoryPillProps) {
  const resolvedTheme = (
    colorTheme && colorTheme in colorThemes ? colorTheme : DEFAULT_THEME
  ) as ColorTheme;

  const { className: colorThemeClassName } = colorThemes[resolvedTheme];

  const categoryPillClassName = classNames(
    'uppercase font-medium rounded-xl border px-1.5 py-0.5 text-[10px]',
    'block w-fit max-w-full break-words whitespace-normal align-bottom',
    colorThemeClassName,
  );

  return <span className={categoryPillClassName}>{name}</span>;
}
