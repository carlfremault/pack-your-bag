import { MdDeleteOutline, MdOutlineEdit } from 'react-icons/md';

import classNames from 'classnames';

import { ColorTheme, colorThemes } from '../../../lib/colorThemes';
import Button from '../button/Button';

export interface CategoryCardProps {
  id: string;
  name: string;
  description?: string;
  colorTheme?: ColorTheme;
  onEditCategory: (id: string) => void;
  onDeleteCategory: (id: string) => void;
}

export default function CategoryCard(props: CategoryCardProps) {
  const { id, name, description, colorTheme = 'slate', onEditCategory, onDeleteCategory } = props;

  const { className: colorThemeClassName } = colorThemes[colorTheme] ?? colorThemes['slate'];
  const colorLabelClassName = classNames('border h-4 w-4 rounded-full', colorThemeClassName);

  const categoryCardClassName =
    'group bg-surface border-primary-ring flex w-full flex-col items-start justify-between gap-2 rounded-md border p-3 text-left shadow-sm';
  const actionGroupClassName =
    'pointer-events-auto flex items-center gap-4 opacity-100 md:pointer-events-none md:opacity-0 md:transition-opacity md:duration-200 md:group-hover:pointer-events-auto md:group-hover:opacity-100 md:group-focus-within:pointer-events-auto md:group-focus-within:opacity-100';

  return (
    <div className={categoryCardClassName}>
      <div className="flex w-full items-center justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className={colorLabelClassName} aria-hidden="true" />
          <h4 className="text-primary truncate text-sm">{name}</h4>
        </div>
        <div className={actionGroupClassName}>
          <Button
            variant="unstyledIcon"
            color="primary"
            aria-label={`Edit ${name}`}
            onClick={() => onEditCategory(id)}
          >
            <MdOutlineEdit className="h-5 w-5" aria-hidden="true" focusable="false" />
          </Button>
          <Button
            variant="unstyledIcon"
            color="danger"
            aria-label={`Delete ${name}`}
            onClick={() => onDeleteCategory(id)}
          >
            <MdDeleteOutline className="h-5 w-5" aria-hidden="true" focusable="false" />
          </Button>
        </div>
      </div>
      {description && <div className="text-xs">{description}</div>}
    </div>
  );
}
