import classNames from 'classnames';

import { type ColorTheme } from '../../../lib/colorThemes';
import { getColorThemeClassName } from '../../../utilities/getColorThemeClassName';

export interface CategoryPillProps {
  name: string;
  colorTheme?: ColorTheme;
}

export function CategoryPill({ name, colorTheme }: CategoryPillProps) {
  const colorThemeClassName = getColorThemeClassName(colorTheme);

  const categoryPillClassName = classNames(
    'uppercase font-medium rounded-xl border px-1.5 py-0.5 text-[10px]',
    'block w-fit max-w-full break-words whitespace-normal align-bottom',
    colorThemeClassName,
  );

  return <span className={categoryPillClassName}>{name}</span>;
}
