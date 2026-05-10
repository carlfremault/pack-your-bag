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
