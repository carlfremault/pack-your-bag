import { NextResponse } from 'next/server';

import { getItemDeleteImpact } from '@/features/item/api';
import { withErrorHandling } from '@/lib/api-handlers';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const data = await getItemDeleteImpact(id);

    return NextResponse.json({ data });
  });
}
