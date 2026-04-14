// Clean up all blob storage images
import { list, del } from '@vercel/blob';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function DELETE(request: Request) {
  try {
    console.log('🧹 Starting blob cleanup...');

    // Get token from environment
    const token = process.env.BLOB_READ_WRITE_TOKEN ||
                  process.env.VERCEL_BLOB_READ_WRITE_TOKEN ||
                  process.env.BLOB_adcreative_READ_WRITE_TOKEN;

    if (!token) {
      console.error('❌ No blob token found');
      return NextResponse.json(
        { success: false, error: 'Blob token not configured' },
        { status: 500 }
      );
    }

    // List all blobs in ad-images folder
    console.log('📋 Listing blobs...');
    const { blobs } = await list({ prefix: 'ad-images/', token });
    console.log(`📋 Found ${blobs.length} blobs`);

    if (blobs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No images to delete',
        deleted: 0
      });
    }

    // Delete all blobs
    console.log('🗑️ Deleting blobs...');
    const deletePromises = blobs.map(blob => {
      console.log(`  Deleting: ${blob.url}`);
      return del(blob.url, { token });
    });

    await Promise.all(deletePromises);
    console.log(`✅ Deleted ${blobs.length} images`);

    return NextResponse.json({
      success: true,
      message: `Deleted ${blobs.length} images`,
      deleted: blobs.length,
      urls: blobs.map(b => b.url)
    });

  } catch (error: any) {
    console.error('❌ Cleanup error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to cleanup' },
      { status: 500 }
    );
  }
}

// Also allow GET for testing
export async function GET(request: Request) {
  return NextResponse.json({
    message: 'Use DELETE method to cleanup blob storage',
    usage: 'curl -X DELETE /api/cleanup'
  });
}