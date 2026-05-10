export function extractLocaleFromHeaders(headers: Headers) {
  const rawLocale = headers.get('accept-language')?.split(',')[0]?.split(';')[0]?.trim();
  const locale = rawLocale?.split('-').slice(0, 2).join('-');
  return locale || undefined;
}
