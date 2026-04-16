import { HttpError } from '@/lib/errors';

type ErrorPayload = {
  error?: {
    message?: unknown;
    status?: unknown;
    details?: unknown;
  };
};

export async function toHttpError(response: Response): Promise<HttpError> {
  let payload: ErrorPayload | undefined;

  try {
    payload = (await response.json()) as ErrorPayload;
  } catch {
    payload = undefined;
  }

  const rawMessage = payload?.error?.message;
  const message =
    typeof rawMessage === 'string'
      ? rawMessage
      : Array.isArray(rawMessage) && typeof rawMessage[0] === 'string'
        ? rawMessage[0]
        : `HTTP ${response.status}`;

  const status =
    typeof payload?.error?.status === 'number' ? payload.error.status : response.status;

  return new HttpError(message, status, payload?.error?.details);
}
