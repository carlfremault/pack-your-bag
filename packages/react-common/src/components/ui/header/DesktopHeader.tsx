import { MdLogout } from 'react-icons/md';

import { Button } from '../button/Button';
import { SettingsButton } from '../button/SettingsButton';
import { DesktopNavButtons } from '../navigation/DesktopNavButtons';
import type { NavItem } from '../navigation/types';

export interface DesktopHeaderProps {
  tabs: NavItem[];
  activeTabId?: string;
  settingsLink: NavItem;
  linkAs?: React.ElementType;
  logOut: () => void;
}

export function DesktopHeader({
  tabs,
  activeTabId,
  settingsLink,
  linkAs,
  logOut,
}: DesktopHeaderProps) {
  return (
    <div className="border-primary-ring bg-surface z-10 flex items-center justify-between border-b px-4 py-3 shadow-sm">
      <DesktopNavButtons tabs={tabs} activeTabId={activeTabId} linkAs={linkAs} />
      <div className="flex items-center gap-4">
        <SettingsButton link={settingsLink} linkAs={linkAs} />
        <form action={logOut} className="flex items-center">
          <Button variant="unstyledIcon" type="submit" aria-label="Log out">
            <MdLogout className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
