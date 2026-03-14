export default function Spinner() {
  return (
    <div role="status" aria-label="Loading">
      <div className="h-4 w-4 animate-spin rounded-full border-t-2 border-b-2 border-white"></div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}
