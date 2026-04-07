import { SettingsButton } from '../button/SettingsButton';
import { DesktopNavButtons } from '../navigation/DesktopNavButtons';
import type { NavItem } from '../navigation/types';

export interface DesktopHeaderProps {
  tabs: NavItem[];
  activeTabId?: string;
  settingsLink: NavItem;
  linkAs?: React.ElementType;
}

export function DesktopHeader({ tabs, activeTabId, settingsLink, linkAs }: DesktopHeaderProps) {
  return (
    <div className="border-primary-ring bg-surface z-10 flex items-center justify-between border-b px-4 py-3 shadow-sm">
      <DesktopNavButtons tabs={tabs} activeTabId={activeTabId} linkAs={linkAs} />
      <SettingsButton link={settingsLink} linkAs={linkAs} />
    </div>
  );
}
