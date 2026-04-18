import { MdLogout } from 'react-icons/md';

import { Button } from '../button/Button';
import { SettingsButton } from '../button/SettingsButton';
import { Logo } from '../logo/Logo';
import { NavItem } from '../navigation/types';

export interface MobileHeaderProps {
  settingsLink: NavItem;
  linkAs?: React.ElementType;
  logOut: () => void;
}

export function MobileHeader(props: MobileHeaderProps) {
  const { settingsLink, linkAs, logOut } = props;
  const LinkComponent = linkAs ?? 'a';

  return (
    <header className="border-primary-ring bg-surface z-10 flex items-center justify-between border-b px-4 py-3 shadow-sm">
      <LinkComponent href="/" aria-label="Go to homepage">
        <Logo />
      </LinkComponent>
      <div className="flex items-center gap-6">
        <SettingsButton link={settingsLink} linkAs={linkAs} />
        <form action={logOut}>
          <Button variant="unstyledIcon" type="submit" aria-label="Log out">
            <MdLogout className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </header>
  );
}
