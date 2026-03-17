'use client';

interface ErrorProps {
  error: Error & { digest?: string; status?: number };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const message = error.digest ?? 'Something went wrong';

  return (
    <div>
      <p>{message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
