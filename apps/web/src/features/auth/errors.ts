import { ApiError } from '@/lib/errors';

export class AuthApiError extends ApiError {
  constructor(
    message: string,
    status: number,
    public readonly errorCode?: string,
  ) {
    super(message, status);
    this.name = 'AuthApiError';
  }
}
