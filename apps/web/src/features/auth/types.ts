export type FormValues = { email?: string; token?: string };

export type FormError = {
  formError: string;
  errorCode?: string;
  values: FormValues;
};
