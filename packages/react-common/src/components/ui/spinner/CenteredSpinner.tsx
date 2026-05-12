import { Spinner } from './Spinner';

export function CenteredSpinner() {
  return (
    <div className="flex justify-center py-3">
      <Spinner size="small" />
    </div>
  );
}
