import classNames from 'classnames';

import type { NavItem } from './types';

export interface DesktopNavButtonsProps {
  tabs: NavItem[];
  activeTabId?: string;
  linkAs?: React.ElementType;
}

export function DesktopNavButtons(props: DesktopNavButtonsProps) {
  const { tabs, activeTabId, linkAs: LinkComponent = 'a' } = props;

  const tabClassName =
    'cursor-pointer active:scale-90 active:bg-primary/10 transition-all duration-150 ease-out flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium tracking-wide';
  const activeClassName = 'bg-surface text-primary shadow-sm';
  const inactiveClassName = 'text-nav-inactive hover:text-nav-inactive-hover';

  return (
    <nav aria-label="Main navigation" className="bg-surface-overlay flex w-fit rounded-md p-1">
      {tabs.map(({ id, label, icon: Icon, href }) => (
        <LinkComponent
          key={id}
          href={href}
          aria-current={activeTabId === id ? 'page' : undefined}
          className={classNames(
            tabClassName,
            activeTabId === id ? activeClassName : inactiveClassName,
          )}
        >
          <Icon className="h-6 w-6" />
          {label}
        </LinkComponent>
      ))}
    </nav>
  );
}
