import { ColorTheme, colorThemes } from '../lib/colorThemes';

const DEFAULT_THEME: ColorTheme = 'slate';

export function getColorThemeClassName(colorTheme: string | null | undefined): string {
  const resolvedTheme = (
    colorTheme && colorTheme in colorThemes ? colorTheme : DEFAULT_THEME
  ) as ColorTheme;

  const { className } = colorThemes[resolvedTheme];

  return className;
}
