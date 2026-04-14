import { CategoryPillProps } from '@repo/react-common/pill';

import { Category } from '@/features/category/types';

export function toCategoryPillProps(category: Category): CategoryPillProps {
  return {
    name: category.name,
    colorTheme: category.colorCode,
  };
}
