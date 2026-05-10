import { Logo } from '../logo/Logo';

export function UnAuthenticatedHeader() {
  return (
    <header className="border-primary-ring bg-surface z-10 flex items-center justify-between border-b px-4 py-3 shadow-sm">
      <Logo />
    </header>
  );
}
