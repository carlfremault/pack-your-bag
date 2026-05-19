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

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SECRET must be set and at least 32 characters');
  }
  return secret;
}

export function getSessionOptions(): SessionOptions {
  return {
    password: getAuthSecret(),
    cookieName: SESSION_COOKIE_NAME,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
  };
}

/**
 * For use in Route Handlers and Server Actions only.
 * Middleware must use getIronSession(req, res, sessionOptions) directly.
 */
export async function getSession() {
  return getIronSession<SessionData>(await cookies(), getSessionOptions());
}
