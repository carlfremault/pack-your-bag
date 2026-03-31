import { navTabs } from './constants';
import { NavTab } from './types';

export interface DesktopNavButtonsProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export default function DesktopNavButtons(props: DesktopNavButtonsProps) {
  const { activeTab, onTabChange } = props;

  return (
    <div className="bg-info-ring flex w-fit rounded-lg p-1">
      {navTabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onTabChange(id)}
          aria-pressed={activeTab === id}
          className={`flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium tracking-wide transition-all ${activeTab === id ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-info-ring text-info-foreground'}`}
        >
          <Icon className="h-6 w-6" />
          {label}
        </button>
      ))}
    </div>
  );
}
