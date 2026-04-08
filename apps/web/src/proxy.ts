import { getIronSession } from 'iron-session';
import { type NextRequest, NextResponse } from 'next/server';

import { getAuthConfig } from '@/lib/auth-config';
import { SESSION_COOKIE_NAME, type SessionData, sessionOptions } from '@/lib/session';

/**
 * This header carries the current (possibly just-refreshed) access token from
 * the middleware to downstream route handlers and server actions.
 * It is always overwritten by the middleware — clients cannot spoof it.
 */
export const INTERNAL_TOKEN_HEADER = 'x-internal-access-token';

const REFRESH_BUFFER_SECONDS = 30;

/** Routes that require no session. Matched as path prefixes. */
const PUBLIC_PATHS = ['/login', '/register', '/policy', '/reset-password'];

/** Public routes where authenticated users should be redirected to /items. */
const AUTH_REDIRECT_PATHS = ['/login', '/register', '/reset-password'];

/**
 * Internal BFF auth routes (/api/auth/*) are always passed through.
 * They manage the session themselves.
 */
const AUTH_API_PREFIX = '/api/auth/';

async function doRefresh(
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken: string; accessTokenExpiresAt: number } | null> {
  try {
    const { authServiceUrl, bffSecret } = getAuthConfig();
    const res = await fetch(`${authServiceUrl}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${refreshToken}`,
        'x-bff-secret': bffSecret,
      },
    });

    if (!res.ok) return null;

    const body = await res.json();
    return {
      accessToken: body.access_token as string,
      refreshToken: body.refresh_token as string,
      accessTokenExpiresAt: Math.floor(Date.now() / 1000) + (body.expires_in as number),
    };
  } catch {
    return null;
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
 * - Programmatic requests: pass through WITHOUT the token header and clear the
 *   session cookie. Downstream handlers (getProductClient etc.) will throw a
 *   readable "session expired" error that React Query surfaces to the user.
 *   The global QueryCache/MutationCache error handler then triggers the redirect.
 */
function handleAuthFailure(req: NextRequest, clearCookie: boolean): NextResponse {
  if (isProgrammaticRequest(req)) {
    const response = NextResponse.next();
    if (clearCookie) response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  const response = NextResponse.redirect(new URL('/login', req.url));
  if (clearCookie) response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}

export default async function middleware(req: NextRequest) {
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
    return session.isLoggedIn && shouldRedirectIfAuthed
      ? NextResponse.redirect(new URL('/items', req.url))
      : NextResponse.next();
  }

  // ── Protected route ─────────────────────────────────────────────────────────

  if (!session.isLoggedIn) {
    return handleAuthFailure(req, false);
  }

  // Defensive check for corrupted session data
  if (!session.accessToken || !session.refreshToken || !session.accessTokenExpiresAt) {
    return handleAuthFailure(req, true);
  }
  const now = Math.floor(Date.now() / 1000);
  const needsRefresh = now >= session.accessTokenExpiresAt - REFRESH_BUFFER_SECONDS;

  if (needsRefresh) {
    const refreshed = await doRefresh(session.refreshToken);

    if (!refreshed) {
      // Refresh token invalid/expired — clear session and handle by request type.
      return handleAuthFailure(req, true);
    }

    // Build response with:
    //   1. Modified request headers so downstream handlers see the new token.
    //   2. The refreshed session cookie so the browser gets it too.
    const requestHeaders = new Headers(req.headers);
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
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set(INTERNAL_TOKEN_HEADER, session.accessToken);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  // Run on all routes except static assets.
  // This intentionally includes /api/* so route handlers also get the token header.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
