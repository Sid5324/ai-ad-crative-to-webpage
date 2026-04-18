// app/api/generate/route.ts - Minimal test version
import { NextResponse } from 'next/server';

const PREVIEWS: Record<string, any> = {};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    return NextResponse.json({
      success: true,
      message: 'API reachable',
      received: body
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.message || 'Invalid request'
    }, { status: 400 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id || !PREVIEWS[id]) {
    return NextResponse.json({ error: 'Preview expired' }, { status: 404 });
  }
  return NextResponse.json(PREVIEWS[id]);
}
