import { HttpError } from '@/lib/errors';

type FieldErrorsPayload = {
  fieldErrors?: Record<string, string[] | undefined>;
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

  const details = error.details as FieldErrorsPayload;
  const fieldErrors = details.fieldErrors;

  if (!fieldErrors || typeof fieldErrors !== 'object') {
    return null;
  }

  const parsedFieldErrors: Partial<Record<TField, string>> = {};

  for (const field of fields) {
    const message = fieldErrors[field]?.[0];
    if (message) {
      parsedFieldErrors[field] = message;
    }
  }

  return Object.keys(parsedFieldErrors).length > 0 ? parsedFieldErrors : null;
}
