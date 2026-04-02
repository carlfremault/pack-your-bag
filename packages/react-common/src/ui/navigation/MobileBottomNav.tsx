import Button from '../button/Button';

import { navTabs } from './constants';
import { NavTab } from './types';

export interface MobileBottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export default function MobileBottomNav(props: MobileBottomNavProps) {
  const { activeTab, onTabChange } = props;

  return (
    <div className="border-primary-ring bg-surface absolute bottom-0 z-10 flex w-full justify-around border-t p-2">
      {navTabs.map(({ id, label, icon: Icon }) => (
        <Button
          key={id}
          onClick={() => onTabChange(id)}
          variant="ghost"
          color={activeTab === id ? 'primary' : 'info'}
          className="flex flex-col"
          aria-current={activeTab === id ? 'page' : undefined}
        >
          <Icon className="h-6 w-6" />
          <div className="mt-1 text-[10px] font-medium tracking-wide">{label}</div>
          {/* Big Dot Indicator */}
          <div
            className={`mx-auto h-1 w-1 rounded-full transition-colors duration-150 ease-out ${
              activeTab === id ? 'bg-primary' : 'bg-transparent'
            }`}
          />
        </Button>
      ))}
    </div>
  );
}
