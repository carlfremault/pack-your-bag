import { HttpError } from '@/lib/errors';

type ZodErrorTree = {
  errors: string[];
  properties?: Record<string, { errors: string[] }>;
};

export function getFieldErrorsFromHttpError<TField extends string>(
  error: unknown,
  fields: readonly TField[],
): Partial<Record<TField, string>> | null {
  if (
    !(error instanceof HttpError) ||
    typeof error.details !== 'object' ||
    error.details === null
  ) {
    return null;
  }

  const { properties } = error.details as ZodErrorTree;

  if (!properties || typeof properties !== 'object') {
    return null;
  }

  const parsedFieldErrors: Partial<Record<TField, string>> = {};

  for (const field of fields) {
    const message = properties[field]?.errors?.[0];
    if (message) {
      parsedFieldErrors[field] = message;
    }
  }

  return Object.keys(parsedFieldErrors).length > 0 ? parsedFieldErrors : null;
}
