import classNames from 'classnames';

import { type ColorTheme, colorThemes } from '../../lib/colorThemes';

export interface CategoryPillProps {
  label: string;
  colorTheme: ColorTheme;
}

export default function CategoryPill({ label, colorTheme }: CategoryPillProps) {
  const { className: colorThemeClassName } = colorThemes[colorTheme];
  const categoryPillClassName = classNames(
    'uppercase font-medium rounded-full border px-1.5 py-0 text-[10px] leading-4 truncate',
    colorThemeClassName,
  );

  return <span className={categoryPillClassName}>{label}</span>;
}
