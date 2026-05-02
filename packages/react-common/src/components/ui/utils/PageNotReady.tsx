import { Spinner } from '../spinner/Spinner';

export function PageNotReady() {
  return (
    <div className="flex h-64 w-full items-center justify-center">
      <Spinner size="large" />
    </div>
  );
}
