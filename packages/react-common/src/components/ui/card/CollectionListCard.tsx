import { HiOutlineScale } from 'react-icons/hi2';
import { MdOutlineFormatListBulleted, MdOutlineRemoveRedEye, MdRemoveRedEye } from 'react-icons/md';

import classNames from 'classnames';

import { ColorTheme, colorThemes } from '../../../lib/colorThemes';
import { ExpandableText } from '../utils';

export interface CollectionListCardProps {
  name: string;
  description?: string;
  colorTheme?: ColorTheme;
  itemCount: number;
  totalWeight: string;
  weightUnit?: string;
  onViewDetails?: () => void;
  isExpanded?: boolean;
  expandedContent?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function CollectionListCard(props: CollectionListCardProps) {
  const {
    name,
    description,
    colorTheme = 'default',
    itemCount,
    totalWeight,
    weightUnit,
    onViewDetails,
    isExpanded = false,
    expandedContent,
    actions,
    className,
  } = props;

  const { className: colorThemeClassName } = colorThemes[colorTheme] ?? colorThemes['default'];

  return (
    <div
      className={classNames(
        'flex min-h-32 w-full flex-col justify-between gap-6 rounded-md border p-4 text-left shadow-sm',
        colorThemeClassName,
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <MdOutlineFormatListBulleted className="h-5 w-5" aria-hidden="true" />
          <h3 className="text-sm font-bold wrap-anywhere">{name}</h3>
        </div>
        {onViewDetails && (
          <button
            type="button"
            aria-label={`${isExpanded ? 'Hide' : 'View'} ${name} details`}
            aria-expanded={isExpanded}
            onClick={onViewDetails}
            className="focus-visible:ring-primary-ring rounded-md focus-visible:ring-2 focus-visible:outline-none"
          >
            {isExpanded ? (
              <MdRemoveRedEye
                className={classNames('h-5 w-5', colorThemeClassName)}
                aria-hidden="true"
              />
            ) : (
              <MdOutlineRemoveRedEye
                className={classNames('h-5 w-5', colorThemeClassName)}
                aria-hidden="true"
              />
            )}
          </button>
        )}
      </div>
      {description && <ExpandableText text={description} />}
      <div className="flex w-full items-center justify-between">
        <div className="flex gap-4 text-nowrap">
          <div className="text-xs">{`${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}</div>
          <div className="flex items-center gap-1 text-xs">
            <HiOutlineScale className="h-3 w-3" aria-hidden="true" />
            {`${totalWeight}${weightUnit ? ` ${weightUnit}` : ''}`}
          </div>
        </div>
        {actions}
      </div>
      {isExpanded && expandedContent && <div>{expandedContent}</div>}
    </div>
  );
}
