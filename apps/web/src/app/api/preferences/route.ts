import { NextResponse } from 'next/server';

import z from 'zod';

import { getPreferences, updatePreferences } from '@/features/settings/api';
import { updatePreferencesSchema } from '@/features/settings/schema';
import { withErrorHandling } from '@/lib/api-handlers';

export async function GET() {
  return withErrorHandling(async () => {
    const data = await getPreferences();

    return NextResponse.json({ data });
  });
}

export async function PATCH(request: Request) {
  return withErrorHandling(async () => {
    const body = await request.json();
    const parsedBody = updatePreferencesSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: {
            message: 'Invalid request body',
            status: 400,
            details: z.treeifyError(parsedBody.error),
          },
        },
        { status: 400 },
      );
    }

    const data = await updatePreferences(parsedBody.data);

    return NextResponse.json({ data }, { status: 200 });
  });
}
