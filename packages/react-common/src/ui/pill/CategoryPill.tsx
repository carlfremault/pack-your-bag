import classNames from 'classnames';

import { type CategoryColor, categoryColors } from '../../lib/categoryColors';

export interface CategoryPillProps {
  label: string;
  color: CategoryColor;
}

export default function CategoryPill({ label, color }: CategoryPillProps) {
  const { className } = categoryColors[color];
  const categoryPillClassName = classNames(
    'uppercase font-medium rounded-full border px-1.5 py-0 text-[10px] leading-4 truncate',
    className,
  );

  return <span className={categoryPillClassName}>{label}</span>;
}
