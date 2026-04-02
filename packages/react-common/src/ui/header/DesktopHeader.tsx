import SettingsButton from '../button/SettingsButton';
import DesktopNavButtons from '../navigation/DesktopNavButtons';
import { NavTab } from '../navigation/types';

export interface DesktopHeaderProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onSettingsClick: () => void;
}

export default function DesktopHeader(props: DesktopHeaderProps) {
  const { activeTab, onTabChange, onSettingsClick } = props;

  return (
    <div className="border-primary-ring bg-surface z-10 flex items-center justify-between border-b px-4 py-3 shadow-sm">
      <DesktopNavButtons activeTab={activeTab} onTabChange={onTabChange} />
      <SettingsButton onClick={onSettingsClick} />
    </div>
  );
}
