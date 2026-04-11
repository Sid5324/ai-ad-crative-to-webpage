import { list } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new NextResponse(
      '<html><body style="font-family:system-ui;padding:40px;"><h1>Missing ID</h1></body></html>',
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  try {
    // List all blobs in previews folder
    const result = await list({ prefix: 'previews/' });
    const blobs = result.blobs || [];
    
    // Find matching blob
    const blob = blobs.find(b => b.pathname?.includes(id));
    
    if (blob?.url) {
      // Fetch the HTML content directly and return it
      const response = await fetch(blob.url);
      const html = await response.text();
      
      return new NextResponse(html, {
        headers: { 
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache'
        }
      });
    }

    // Not found
    return new NextResponse(
      `<html>
        <head>
          <style>
            body{font-family:system-ui;padding:40px;text-align:center;background:#f5f5f5}
            .box{max-width:500px;margin:0 auto;background:white;padding:40px;border-radius:12px}
            h1{color:#333}
            p{color:#666}
            a{color:#3b82f6}
          </style>
        </head>
        <body>
          <div class="box">
            <h1>Preview Not Found</h1>
            <p>This preview may have expired.</p>
            <a href="/">← Generate New Page</a>
          </div>
        </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html' }, status: 404 }
    );
  } catch (error) {
    return new NextResponse(
      '<html><body style="font-family:system-ui;padding:40px;"><h1>Error Loading Preview</h1></body></html>',
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}