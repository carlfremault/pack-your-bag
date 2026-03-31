import classNames from 'classnames';

import { type CategoryColor, categoryColors } from '../../lib/categoryColors';

interface CategoryPillProps {
  label: string;
  color: CategoryColor;
}

export default function CategoryPill({ label, color }: CategoryPillProps) {
  const { className } = categoryColors[color];
  const categoryPillClassName = classNames(
    'uppercase font-bold tracking-wide rounded-full border px-2.5 py-0.5 text-xs',
    className,
  );

  return <span className={categoryPillClassName}>{label}</span>;
}
