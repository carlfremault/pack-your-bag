import { type ColorTheme } from '@repo/react-common/color-themes';
import { CategoryPillProps } from '@repo/react-common/pill';

export function toCategoryPillProps(category: {
  name: string;
  colorTheme: string;
}): CategoryPillProps {
  return {
    name: category.name,
    colorTheme: category.colorTheme as ColorTheme,
  };
}
