import { Logo } from '../logo/Logo';

export function Sidebar({ children }: { children?: React.ReactNode }) {
  return (
    <aside className="border-info-ring bg-surface flex h-full w-1/5 min-w-64 shrink-0 flex-col border-r px-4 py-3 shadow-sm">
      <div className="self-start">
        <Logo />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center">{children}</div>
    </aside>
  );
}
