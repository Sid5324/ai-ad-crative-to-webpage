import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();
  return NextResponse.json({ success: true, message: 'Simple test works', received: body });
}

export async function GET() {
  return NextResponse.json({ method: 'GET' });
}
