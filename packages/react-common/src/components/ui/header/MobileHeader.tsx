import { SettingsButton } from '../button/SettingsButton';
import Logo from '../logo/Logo';
import { NavItem } from '../navigation/types';

export interface MobileHeaderProps {
  settingsLink: NavItem;
  linkAs?: React.ElementType;
}

export function MobileHeader(props: MobileHeaderProps) {
  const { settingsLink, linkAs } = props;

  return (
    <header className="border-primary-ring bg-surface z-10 flex items-center justify-between border-b px-4 py-3 shadow-sm">
      <Logo />
      <SettingsButton link={settingsLink} linkAs={linkAs} />
    </header>
  );
}
