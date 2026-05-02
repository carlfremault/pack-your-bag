import { Spinner } from '../spinner/Spinner';

export function FormNotReady() {
  return (
    <div className="text-center">
      <Spinner size="small" />
    </div>
  );
}
