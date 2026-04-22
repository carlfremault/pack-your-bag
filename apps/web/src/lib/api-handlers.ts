import { NextResponse } from 'next/server';

import { ApiError } from '@/lib/errors';
import { extractErrorMessage } from '@/utils/extractApiErrorDetails';

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

export function handleApiResponse<T>(
  data: T | undefined,
  error: unknown,
  response: Response | undefined,
): T {
  if (error) {
    throw new ApiError(extractErrorMessage(error), response?.status ?? 500);
  }
  if (!data) throw new ApiError('No data returned', 500);
  return data;
}

export function handleApiVoidResponse(error: unknown, response: Response | undefined): void {
  if (error) {
    throw new ApiError(extractErrorMessage(error), response?.status ?? 500);
  }
}
