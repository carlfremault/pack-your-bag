export const formatLocaleDate = (date: Date, locale: string = 'en-GB'): string => {
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid date provided');
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(date);
};
