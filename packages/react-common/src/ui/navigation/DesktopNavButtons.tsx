import classNames from 'classnames';

import { navTabs } from './constants';
import { NavTab } from './types';

export interface DesktopNavButtonsProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export default function DesktopNavButtons(props: DesktopNavButtonsProps) {
  const { activeTab, onTabChange } = props;

  const buttonClassName =
    'cursor-pointer active:scale-90 active:bg-primary/10 transition-all duration-150 ease-out flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium tracking-wide';
  const activeButtonClassName = 'bg-secondary text-secondary-foreground shadow-sm';
  const inactiveButtonClassName = 'text-nav-inactive hover:text-nav-inactive-hover';

  return (
    <div className="bg-surface-overlay flex w-fit rounded-md p-1">
      {navTabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onTabChange(id)}
          aria-pressed={activeTab === id}
          className={classNames(
            buttonClassName,
            activeTab === id ? activeButtonClassName : inactiveButtonClassName,
          )}
        >
          <Icon className="h-6 w-6" />
          {label}
        </button>
      ))}
    </div>
  );
}
