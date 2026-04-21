import { NextResponse } from 'next/server';

import { getAllCategories } from '@/features/category/api';
import { withErrorHandling } from '@/lib/api-handler';

export async function GET() {
  return withErrorHandling(async () => {
    const data = await getAllCategories();

    return NextResponse.json({ data });
  });
}
