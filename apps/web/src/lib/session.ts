import { cookies } from 'next/headers';

import { getIronSession, type SessionOptions } from 'iron-session';

export interface SessionData {
  isLoggedIn?: boolean;
  userId?: string;
  role?: number;
  isGuest?: boolean;
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
