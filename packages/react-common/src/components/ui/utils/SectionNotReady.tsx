import { Spinner } from '../spinner/Spinner';

export function SectionNotReady() {
  return (
    <div className="flex w-full justify-center p-8">
      <Spinner size="large" />
    </div>
  );
}
