import { Logo } from '../logo/Logo';

export interface SidebarProps {
  linkAs?: React.ElementType;
  children?: React.ReactNode;
}
export function Sidebar(props: SidebarProps) {
  const { linkAs: LinkComponent = 'a', children } = props;

  return (
    <aside className="border-info-ring bg-surface flex h-full w-full min-w-64 shrink-0 flex-col border-r px-4 py-3 shadow-sm">
      <div className="self-start">
        <LinkComponent
          href="/"
          aria-label="Go to homepage"
          className="focus-visible:ring-primary-ring rounded focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <Logo />
        </LinkComponent>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center">{children}</div>
    </aside>
  );
}
