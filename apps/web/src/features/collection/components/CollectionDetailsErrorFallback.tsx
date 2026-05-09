import { Alert } from '@repo/react-common/alert';

export default function CollectionDetailsErrorFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Alert type="error" message="Failed to load collection. Please try again later." />
    </div>
  );
}
