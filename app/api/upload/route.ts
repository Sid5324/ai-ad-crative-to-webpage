import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Get token from environment - check both possible names
    const token = process.env.BLOB_READ_WRITE_TOKEN || 
                  process.env.VERCEL_BLOB_READ_WRITE_TOKEN ||
                  process.env.BLOB_adcreative_READ_WRITE_TOKEN;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Upload not configured. Please add BLOB token in Vercel settings.' },
        { status: 500 }
      );
    }

    // Upload to Vercel Blob with explicit token
    const blob = await put(`ad-images/${Date.now()}-${file.name}`, file, {
      access: 'public',
      token: token,
    });

    return NextResponse.json({
      success: true,
      url: blob.url,
      size: file.size,
      type: file.type,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}