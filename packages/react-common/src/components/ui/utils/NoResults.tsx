import { MdOutlineExplore } from 'react-icons/md';

export function NoResults({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-8 md:flex-row">
      <div className="bg-surface-overlay flex items-center justify-center rounded-full p-4">
        <MdOutlineExplore className="text-primary" size={64} aria-hidden="true" />
      </div>
      <div className="flex flex-col items-center gap-2 text-sm md:items-start">{children}</div>
    </div>
  );
}
