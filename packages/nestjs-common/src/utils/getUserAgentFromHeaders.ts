import { IncomingHttpHeaders } from 'http';

/**
 * Extracts the user agent string from HTTP request headers.
 *
 * @param headers - The incoming HTTP request headers
 * @returns The user agent string, or 'unknown' if not present or empty
 */
export function getUserAgentFromHeaders(headers: IncomingHttpHeaders): string {
  const rawUserAgent = headers['user-agent'];

  if (!rawUserAgent) {
    return 'unknown';
  }

  const userAgent = Array.isArray(rawUserAgent) ? (rawUserAgent[0] as string) : rawUserAgent;
  return userAgent || 'unknown';
}
