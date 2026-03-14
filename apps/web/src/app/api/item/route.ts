import { NextResponse } from 'next/server';

import { getItems } from '@/features/items/api';

export async function GET() {
  const { data, error, response } = await getItems();

  if (error) {
    const status = response?.status ?? 500;
    return NextResponse.json({ error }, { status });
  }

  return NextResponse.json({ data });
}
