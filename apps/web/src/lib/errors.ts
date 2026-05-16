export class ApiError extends Error {
  digest: string;

  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
    this.digest = status < 500 ? message : 'Something went wrong';
  }
}

export function isApiError(e: unknown): e is ApiError {
  return (
    e instanceof Error &&
    'status' in e &&
    'digest' in e &&
    typeof (e as { status: unknown }).status === 'number'
  );
}

export class HttpError extends Error {
  details?: unknown;

  constructor(
    message: string,
    public status: number,
    details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
    this.details = details;
  }
}
