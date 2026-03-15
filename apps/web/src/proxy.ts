import type { NextProxy } from 'next/server';
import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';

export default auth((req) => {
  const isAuthenticated = !!req.auth;
  const isAuthRoute = req.nextUrl.pathname.startsWith('/login');

  if (!isAuthenticated && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL('/items', req.url));
  }

  return NextResponse.next();
}) as unknown as NextProxy;

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
