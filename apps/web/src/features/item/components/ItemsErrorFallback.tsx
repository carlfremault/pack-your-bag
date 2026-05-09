import { Alert } from '@repo/react-common/alert';

export default function ItemsErrorFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <Alert type="error" message="Failed to load items. Please try again later." />
    </div>
  );
}
