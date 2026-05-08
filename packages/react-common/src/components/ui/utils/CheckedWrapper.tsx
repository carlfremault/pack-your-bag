import { MdOutlineCheckCircle } from 'react-icons/md';

export function CheckedWrapper({ children }: { children: React.ReactNode }) {
  const Wrapper = typeof children === 'string' ? 'p' : 'div';

  return (
    <div className="flex items-center gap-2">
      <MdOutlineCheckCircle size={15} className="text-success shrink-0" aria-hidden="true" />
      <Wrapper>{children}</Wrapper>
    </div>
  );
}
