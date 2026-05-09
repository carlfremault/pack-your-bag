import { Alert } from '@repo/react-common/alert';

export default function ErrorFallback({ message }: { message: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <Alert type="error" message={message} />
    </div>
  );
}
