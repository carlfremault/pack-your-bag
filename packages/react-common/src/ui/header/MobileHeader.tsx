import SettingsButton from '../button/SettingsButton';
import Logo from '../logo/Logo';

export interface MobileHeaderProps {
  onSettingsClick: () => void;
}

export default function MobileHeader(props: MobileHeaderProps) {
  const { onSettingsClick } = props;

  return (
    <header className="border-primary-ring bg-background z-10 flex items-center justify-between border-b px-4 py-3 shadow-sm">
      <Logo />

      <SettingsButton onClick={onSettingsClick} />
    </header>
  );
}
