import { DateFormat, DEFAULT_LOCALE, TimeFormat, Units } from '@repo/constants';

export function parseAcceptLanguage(header: string | null): string[] {
  if (!header) return [DEFAULT_LOCALE];
  const languages = header
    .split(',')
    .map((entry) => {
      const [tag, ...params] = entry.trim().split(';');
      const qParam = params.find((p) => p.trim().startsWith('q='));
      const q = qParam ? parseFloat(qParam.trim().slice(2)) : 1;
      return { tag: tag!.trim(), q: Number.isFinite(q) ? q : 0 };
    })
    .filter(({ tag }) => tag.length > 0)
    .sort((a, b) => b.q - a.q)
    .map(({ tag }) => tag);
  return languages.length > 0 ? languages : [DEFAULT_LOCALE];
}

function parseLocale(tag: string): Intl.Locale | null {
  try {
    return new Intl.Locale(tag.split(';')[0]!.trim());
  } catch {
    return null;
  }
}

function resolveRegion(languages: ReadonlyArray<string>): string | undefined {
  for (const tag of languages) {
    const loc = parseLocale(tag);
    if (loc?.region) return loc.region;
  }
  return undefined;
}

export function deriveDefaultPreferences(languages: ReadonlyArray<string>): {
  units: Units;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  theme: null;
} {
  const primary = languages[0] ?? DEFAULT_LOCALE;
  const locale = parseLocale(primary) ?? new Intl.Locale(DEFAULT_LOCALE);
  const region = locale.region ?? resolveRegion(languages);
  const hasRegion = region !== undefined;

  const normalized = hasRegion ? `${locale.language}-${region}` : locale.toString();

  const units = ['US', 'LR', 'MM'].includes(region ?? '') ? Units.IMPERIAL : Units.METRIC;

  let timeFormat: TimeFormat;
  let dateFormat: DateFormat;

  if (!hasRegion) {
    timeFormat = TimeFormat.TWENTY_FOUR_HOUR;
    dateFormat = DateFormat.YYYY_MM_DD_DASH;
  } else {
    const hour12 = new Intl.DateTimeFormat(normalized, { hour: 'numeric' }).resolvedOptions()
      .hour12;
    timeFormat = hour12 === false ? TimeFormat.TWENTY_FOUR_HOUR : TimeFormat.TWELVE_HOUR;

    const parts = new Intl.DateTimeFormat(normalized, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date(2000, 2, 14));

    const order = parts
      .filter((p) => p.type === 'year' || p.type === 'month' || p.type === 'day')
      .map((p) => p.type);

    const separator = parts.find((p) => p.type === 'literal')?.value?.includes('/') ? '/' : '-';

    if (order[0] === 'year') {
      dateFormat = separator === '/' ? DateFormat.YYYY_MM_DD_SLASH : DateFormat.YYYY_MM_DD_DASH;
    } else if (order[0] === 'month') {
      dateFormat = separator === '/' ? DateFormat.MM_DD_YY_SLASH : DateFormat.MM_DD_YY_DASH;
    } else {
      dateFormat = separator === '/' ? DateFormat.DD_MM_YY_SLASH : DateFormat.DD_MM_YY_DASH;
    }
  }

  return { units, dateFormat, timeFormat, theme: null };
}
