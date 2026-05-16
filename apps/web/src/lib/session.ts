import { cookies } from 'next/headers';
import { type NextRequest, type NextResponse } from 'next/server';

import { getIronSession, type SessionOptions } from 'iron-session';

export interface SessionData {
  isLoggedIn?: boolean;
  userId?: string;
  role?: number;
  accessToken?: string;
  refreshToken?: string;
  /** Unix timestamp in seconds */
  accessTokenExpiresAt?: number;
  pendingVerificationEmail?: string;
}

export const SESSION_COOKIE_NAME = 'pyb-session';

/**
 * AUTH_SECRET doubles as the iron-session encryption password.
 * Must be at least 32 characters.
 */
const authSecret = process.env.AUTH_SECRET;
if (!authSecret || authSecret.length < 32) {
  throw new Error('AUTH_SECRET must be set and at least 32 characters');
}

export const sessionOptions: SessionOptions = {
  password: authSecret,
  cookieName: SESSION_COOKIE_NAME,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  },
};

/**
 * For use in Route Handlers and Server Actions only.
 * Middleware must use getIronSession(req, res, sessionOptions) directly.
 */
export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

interface LoginResponseForSession {
  user: { id?: string; role?: number };
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

/**
 * Saves a full auth session onto a route handler redirect response.
 * Use this instead of `getSession()` when you need the session cookie
 * baked onto a `NextResponse.redirect()`.
 */
export async function createRouteSession(
  request: NextRequest,
  response: NextResponse,
  loginResponse: LoginResponseForSession,
): Promise<void> {
  const session = await getIronSession<SessionData>(request, response, sessionOptions);
  session.isLoggedIn = true;
  session.userId = loginResponse.user.id;
  session.role = loginResponse.user.role;
  session.accessToken = loginResponse.access_token;
  session.refreshToken = loginResponse.refresh_token;
  session.accessTokenExpiresAt = Math.floor(Date.now() / 1000) + loginResponse.expires_in;
  session.pendingVerificationEmail = undefined;
  await session.save();
}
