import { type NextRequest, NextResponse } from 'next/server';

import { getIronSession } from 'iron-session';

import { getAuthConfig } from '@/lib/clients/auth-config';
import { SESSION_COOKIE_NAME, type SessionData, sessionOptions } from '@/lib/session';

import { AUTH_REDIRECT_PATHS, PUBLIC_PATHS } from './lib/constants';

/**
 * This header carries the current (possibly just-refreshed) access token from
 * the middleware to downstream route handlers and server actions.
 * It is always overwritten by the middleware — clients cannot spoof it.
 */
export const INTERNAL_TOKEN_HEADER = 'x-internal-access-token';

const REFRESH_BUFFER_SECONDS = 30;

/**
 * Internal BFF auth routes (/api/auth/*) are always passed through.
 * They manage the session themselves.
 */
const AUTH_API_PREFIX = '/api/auth/';

type RefreshResult =
  | { kind: 'success'; accessToken: string; refreshToken: string; accessTokenExpiresAt: number }
  | { kind: 'invalid' }
  | { kind: 'transient' };

async function doRefresh(refreshToken: string): Promise<RefreshResult> {
  try {
    const { authServiceUrl, bffSecret } = getAuthConfig();
    const res = await fetch(`${authServiceUrl}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${refreshToken}`,
        'x-bff-secret': bffSecret,
      },
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        return { kind: 'invalid' };
      }
      return { kind: 'transient' };
    }

    const body = await res.json();
    return {
      kind: 'success',
      accessToken: body.access_token as string,
      refreshToken: body.refresh_token as string,
      accessTokenExpiresAt: Math.floor(Date.now() / 1000) + (body.expires_in as number),
    };
  } catch {
    return { kind: 'transient' };
  }
}

/**
 * Server action calls carry a `next-action` header set by the Next.js runtime.
 * API route calls start with /api/. Both are "programmatic" — the browser fetch
 * API is in control, not a top-level navigation, so a redirect won't change the page.
 */
function isProgrammaticRequest(req: NextRequest): boolean {
  return !!req.headers.get('next-action') || req.nextUrl.pathname.startsWith('/api/');
}

/**
 * Handle an authentication failure.
 *
 * - Navigation requests: redirect to /login (browser follows naturally).
 * - Programmatic requests: pass through WITHOUT the token header and optionally
 *   clear the session cookie. Downstream handlers (getProductClient etc.) will throw a
 *   readable "session expired" error that React Query surfaces to the user.
 *   The global QueryCache/MutationCache error handler then triggers the redirect.
 */
function handleAuthFailure(req: NextRequest, clearCookie: boolean, expired = true): NextResponse {
  if (isProgrammaticRequest(req)) {
    const response = NextResponse.next();
    if (clearCookie) response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  const loginUrl = new URL('/login', req.url);
  if (expired) loginUrl.searchParams.set('reason', 'session_expired');
  const response = NextResponse.redirect(loginUrl);
  if (clearCookie) response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}

export default async function middleware(req: NextRequest): Promise<NextResponse> {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const response = await handleRequest(req, nonce);
  const cspHeader =
    process.env.NODE_ENV === 'development'
      ? 'Content-Security-Policy-Report-Only'
      : 'Content-Security-Policy';
  response.headers.set(cspHeader, buildCsp(nonce));
  return response;
}

async function handleRequest(req: NextRequest, nonce: string): Promise<NextResponse> {
  const { pathname } = req.nextUrl;

  // Internal auth API routes manage their own session — skip all checks.
  if (pathname.startsWith(AUTH_API_PREFIX)) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const shouldRedirectIfAuthed = AUTH_REDIRECT_PATHS.some((p) => pathname.startsWith(p));

  // Read the session from the request cookie (temp response — we won't save to it).
  const session = await getIronSession<SessionData>(req, new NextResponse(), sessionOptions);

  if (isPublic) {
    // Redirect already-authenticated users away from auth-related pages.
    if (session.isLoggedIn && shouldRedirectIfAuthed) {
      return NextResponse.redirect(new URL('/items', req.url));
    }
    return NextResponse.next({ request: { headers: withNonce(req, nonce) } });
  }

  // ── Protected route ─────────────────────────────────────────────────────────

  if (!session.isLoggedIn) {
    return handleAuthFailure(req, false, false);
  }

  // Defensive check for corrupted session data
  if (!session.accessToken || !session.refreshToken || !session.accessTokenExpiresAt) {
    return handleAuthFailure(req, true);
  }
  const now = Math.floor(Date.now() / 1000);
  const needsRefresh = now >= session.accessTokenExpiresAt - REFRESH_BUFFER_SECONDS;

  if (needsRefresh) {
    const refreshed = await doRefresh(session.refreshToken);

    if (refreshed.kind !== 'success') {
      // Clear the session only for definitive auth failures.
      // Transient upstream errors should not force logout.
      // Root is just a routing stub — don't signal "session expired" there.
      const isRoot = pathname === '/';
      return handleAuthFailure(req, refreshed.kind === 'invalid', !isRoot);
    }

    // Build response with:
    //   1. Modified request headers so downstream handlers see the new token.
    //   2. The refreshed session cookie so the browser gets it too.
    const requestHeaders = withNonce(req, nonce);
    requestHeaders.set(INTERNAL_TOKEN_HEADER, refreshed.accessToken);
    const response = NextResponse.next({ request: { headers: requestHeaders } });

    // Write refreshed tokens to the session cookie on the response.
    const sessionToSave = await getIronSession<SessionData>(req, response, sessionOptions);
    sessionToSave.isLoggedIn = true;
    sessionToSave.userId = session.userId;
    sessionToSave.role = session.role;
    sessionToSave.accessToken = refreshed.accessToken;
    sessionToSave.refreshToken = refreshed.refreshToken;
    sessionToSave.accessTokenExpiresAt = refreshed.accessTokenExpiresAt;
    await sessionToSave.save();

    return response;
  }

  // Token is still fresh — inject it as a header for downstream use.
  const requestHeaders = withNonce(req, nonce);
  requestHeaders.set(INTERNAL_TOKEN_HEADER, session.accessToken);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

function buildCsp(nonce: string): string {
  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'nonce-${nonce}'`,
    `img-src 'self' data: blob:`,
    `font-src 'self'`,
    `connect-src 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-src 'self' chrome-extension: moz-extension:`,
    `frame-ancestors 'none'`,
  ].join('; ');
}

function withNonce(req: NextRequest, nonce: string): Headers {
  const headers = new Headers(req.headers);
  headers.set('x-nonce', nonce);
  return headers;
}

export const config = {
  // Run on all routes except static assets.
  // This intentionally includes /api/* so route handlers also get the token header.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
