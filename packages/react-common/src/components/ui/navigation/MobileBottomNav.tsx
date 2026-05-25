import classNames from 'classnames';

import type { NavItem } from './types';

export interface MobileBottomNavProps {
  tabs: NavItem[];
  activeTabId?: string;
  linkAs?: React.ElementType;
}

export function MobileBottomNav(props: MobileBottomNavProps) {
  const { tabs, activeTabId, linkAs: LinkComponent = 'a' } = props;

  const tabClassName =
    'inline-flex h-11 w-fit cursor-pointer flex-col items-center justify-center px-5 text-base font-medium tracking-wide rounded-md transition-[filter,transform,box-shadow,color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2';
  const activeClassName = 'text-primary ring-primary-ring hover:bg-primary/10';
  const inactiveClassName = 'text-info ring-info-ring hover:bg-info/10';

  return (
    <nav
      aria-label="Main navigation"
      className="border-primary-ring bg-surface fixed bottom-0 z-10 flex w-full justify-around border-t p-2"
    >
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
          <div className="mt-1 text-[10px] font-medium tracking-wide">{label}</div>
          <div
            className={classNames(
              'mx-auto h-1 w-1 rounded-full transition-colors duration-150 ease-out',
              activeTabId === id ? 'bg-primary' : 'bg-transparent',
            )}
          />
        </LinkComponent>
      ))}
    </nav>
  );
}
