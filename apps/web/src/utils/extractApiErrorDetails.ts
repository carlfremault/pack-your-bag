type ApiErrorObject = {
  message?: string | string[];
  error?: string;
};

function isApiErrorObject(error: unknown): error is ApiErrorObject {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const hasMessage = 'message' in error;
  const hasError = 'error' in error;

  if (!hasMessage && !hasError) {
    return false;
  }

  const obj = error as Record<string, unknown>;
  const msg = obj.message;
  const err = obj.error;

  const validMessage = msg === undefined || typeof msg === 'string' || Array.isArray(msg);
  const validError = err === undefined || typeof err === 'string';

  return validMessage && validError;
}

export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (isApiErrorObject(error)) {
    const msg = error.message;
    if (Array.isArray(msg)) {
      return msg[0] ?? 'Something went wrong';
    }
    if (typeof msg === 'string') {
      return msg;
    }
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Something went wrong';
}

export function extractErrorType(error: unknown): string | undefined {
  if (isApiErrorObject(error)) {
    return error.error;
  }
  return undefined;
}
