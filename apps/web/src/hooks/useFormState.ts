'use client';

import { useState } from 'react';

import { getFieldErrorsFromHttpError } from '@/utils/getFieldErrors';

export function useFormState<TValues extends Record<string, string>>(
  initialValues: TValues,
  fieldNames: (keyof TValues & string)[],
) {
  const [formValues, setFormValues] = useState<TValues>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof TValues, string>>>({});

  const handleFieldChange = (fieldName: keyof TValues & string, value: string) => {
    setFormValues((current) => ({ ...current, [fieldName]: value }));
    setFieldErrors((current) => {
      if (!current[fieldName]) return current;
      return { ...current, [fieldName]: undefined };
    });
  };

  const handleReset = () => {
    setFormValues(initialValues);
    setFieldErrors({});
  };

  const handleError = (error: Error) => {
    const fieldLevelErrors = getFieldErrorsFromHttpError(error, fieldNames);
    if (fieldLevelErrors) {
      setFieldErrors(fieldLevelErrors as Partial<Record<keyof TValues, string>>);
      return;
    }
    setFieldErrors({});
  };

  return { formValues, fieldErrors, setFieldErrors, handleFieldChange, handleReset, handleError };
}
