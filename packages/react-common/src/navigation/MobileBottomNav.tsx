import { IoShirt } from 'react-icons/io5';
import { MdHiking, MdShoppingBag } from 'react-icons/md';

import Button from '../button/Button';

export type MobileNavTab = 'items' | 'collections' | 'trips';
export interface MobileBottomNavProps {
  activeTab: MobileNavTab;
  onTabChange: (tab: MobileNavTab) => void;
}

export default function MobileBottomNav(props: MobileBottomNavProps) {
  const { activeTab, onTabChange } = props;

  const tabs = [
    { id: 'items', label: 'Items', icon: IoShirt },
    { id: 'collections', label: 'Collections', icon: MdShoppingBag },
    { id: 'trips', label: 'Trips', icon: MdHiking },
  ] as const;

  return (
    <div className="border-primary-ring bg-background absolute bottom-0 z-10 flex w-full justify-around border-t p-2">
      {tabs.map(({ id, label, icon: Icon }) => (
        <Button
          key={id}
          onClick={() => onTabChange(id)}
          variant="ghost"
          color={activeTab === id ? 'secondary' : 'info'}
          className="flex flex-col transition-colors"
          aria-current={activeTab === id ? 'page' : undefined}
        >
          <Icon className="h-6 w-6" />
          <div className="mt-1 text-[10px] font-medium">{label}</div>
          <div
            className={`mx-auto h-1 w-1 rounded-full transition-colors duration-150 ${
              activeTab === id ? 'bg-secondary' : 'bg-transparent'
            }`}
          />
        </Button>
      ))}
    </div>
  );
}
