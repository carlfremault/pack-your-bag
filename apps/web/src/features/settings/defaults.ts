import { DateFormat, DEFAULT_LOCALE, TimeFormat, Units } from '@repo/constants';

export function deriveDefaultPreferences(acceptLanguage: string | null): {
  units: Units;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  theme: null;
} {
  const rawLocale =
    ((acceptLanguage || DEFAULT_LOCALE).split(',')[0] ?? DEFAULT_LOCALE).split(';')[0]?.trim() ??
    DEFAULT_LOCALE;

  let locale: Intl.Locale;
  try {
    locale = new Intl.Locale(rawLocale);
  } catch {
    locale = new Intl.Locale(DEFAULT_LOCALE);
  }

  const normalized = locale.toString();

  const units = ['US', 'LR', 'MM'].includes(locale.region ?? '') ? Units.IMPERIAL : Units.METRIC;

  const hour12 = new Intl.DateTimeFormat(normalized, { hour: 'numeric' }).resolvedOptions().hour12;
  const timeFormat = hour12 === false ? TimeFormat.TWENTY_FOUR_HOUR : TimeFormat.TWELVE_HOUR;

  const parts = new Intl.DateTimeFormat(normalized, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(2000, 2, 14));

  const order = parts
    .filter((p) => p.type === 'year' || p.type === 'month' || p.type === 'day')
    .map((p) => p.type);

  const separator = parts.find((p) => p.type === 'literal')?.value?.includes('/') ? '/' : '-';

  let dateFormat: DateFormat;
  if (order[0] === 'year') {
    dateFormat = separator === '/' ? DateFormat.YYYY_MM_DD_SLASH : DateFormat.YYYY_MM_DD_DASH;
  } else if (order[0] === 'month') {
    dateFormat = separator === '/' ? DateFormat.MM_DD_YY_SLASH : DateFormat.MM_DD_YY_DASH;
  } else {
    dateFormat = separator === '/' ? DateFormat.DD_MM_YY_SLASH : DateFormat.DD_MM_YY_DASH;
  }

  return { units, dateFormat, timeFormat, theme: null };
}
