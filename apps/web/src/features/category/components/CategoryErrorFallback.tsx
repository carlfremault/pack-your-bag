import { Alert } from '@repo/react-common/alert';

export function CategoryErrorFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <Alert type="error" message="Failed to load categories. Please try again later." />
    </div>
  );
}
