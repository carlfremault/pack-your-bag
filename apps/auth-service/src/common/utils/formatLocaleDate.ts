/**
 * Formats a date in a user-friendly format based on locale
 *
 * @param {Date} date - The date to be formatted
 * @param {string} locale - The locale to use for formatting the date, defaults to 'en-GB'
 *
 * @returns {string} The formatted date
 */
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
