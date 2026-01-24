import { IncomingHttpHeaders } from 'http';

export function getUserAgentFromHeaders(headers: IncomingHttpHeaders): string {
  const rawUserAgent = headers['user-agent'];

  if (!rawUserAgent) {
    return 'unknown';
  }

  const userAgent = Array.isArray(rawUserAgent) ? (rawUserAgent[0] as string) : rawUserAgent;
  return userAgent || 'unknown';
}
