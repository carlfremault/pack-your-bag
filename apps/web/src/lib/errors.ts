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

export const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please sign in again.';
