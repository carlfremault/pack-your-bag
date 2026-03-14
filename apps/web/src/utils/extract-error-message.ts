type ErrorObject = {
  message?: string | string[];
};

function isErrorObject(error: unknown): error is ErrorObject {
  if (typeof error !== 'object' || error === null || !('message' in error)) {
    return false;
  }
  const msg = (error as Record<string, unknown>).message;
  return typeof msg === 'string' || Array.isArray(msg);
}

export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (isErrorObject(error)) {
    const msg = error.message;
    if (Array.isArray(msg)) {
      return msg[0] ?? 'An unknown error occurred';
    }
    if (typeof msg === 'string') {
      return msg;
    }
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unknown error occurred';
}
