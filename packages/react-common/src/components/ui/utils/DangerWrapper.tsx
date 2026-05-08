import { MdOutlineWarningAmber } from 'react-icons/md';

export function DangerWrapper({ children }: { children: React.ReactNode }) {
  const Wrapper = typeof children === 'string' ? 'p' : 'div';

  return (
    <div className="bg-danger/10 border-danger flex items-start gap-2 rounded-md border p-4">
      <MdOutlineWarningAmber size={15} className="text-danger mt-0.5 shrink-0" aria-hidden="true" />
      <Wrapper className="text-danger">{children}</Wrapper>
    </div>
  );
}
