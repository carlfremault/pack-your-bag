import { NextResponse } from 'next/server';

import { ApiError } from '@/lib/errors';

type RouteHandler = () => Promise<NextResponse>;

export async function withErrorHandling(handler: RouteHandler): Promise<NextResponse> {
  try {
    return await handler();
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json(
        { error: { message: e.message, status: e.status } },
        { status: e.status },
      );
    }
    const message = e instanceof Error ? e.message : 'Internal Server Error';
    return NextResponse.json({ error: { message, status: 500 } }, { status: 500 });
  }
}
