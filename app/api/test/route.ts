// app/api/test/route.ts - Testing Endpoint
import { NextResponse } from 'next/server';
import { modernOrchestrator } from '@/lib/core/modern-orchestrator';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { testCategory, testIds } = body;

    console.log('🧪 Running tests:', { testCategory, testIds });

    const result = await modernOrchestrator.runTests();

    // Filter results if requested
    let filteredResults = result.results;
    if (testCategory) {
      filteredResults = filteredResults.filter(r => r.category === testCategory);
    }
    if (testIds) {
      filteredResults = filteredResults.filter(r => testIds.includes(r.testId));
    }

    return NextResponse.json({
      success: true,
      summary: result.summary,
      results: filteredResults,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Test execution failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  // Run a quick health test
  try {
    const health = await modernOrchestrator.getHealth();
    return NextResponse.json({
      status: 'ok',
      system: health.status,
      tests: 'available',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'System unhealthy'
    }, { status: 503 });
  }
}