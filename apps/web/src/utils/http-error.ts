import { HttpError } from '@/lib/errors';

type ErrorPayload = {
  error?: {
    message?: unknown;
    status?: unknown;
  };
};

export async function toHttpError(response: Response): Promise<HttpError> {
  let payload: ErrorPayload | undefined;

  try {
    payload = (await response.json()) as ErrorPayload;
  } catch {
    payload = undefined;
  }

  const message =
    typeof payload?.error?.message === 'string' ? payload.error.message : `HTTP ${response.status}`;

  const status =
    typeof payload?.error?.status === 'number' ? payload.error.status : response.status;

  return new HttpError(message, status);
}
